import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Check, LocateFixed, Map, RotateCcw, Square, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance, formatDuration, t } from '@/lib/translate';
import { cueToFire, nextCue, toneFor } from '@/lib/cueEngine';
import { alongRouteM, pathLengthM, pointAtDistance, progressOnRoute } from '@/lib/geo';
import { playHaptic, stopHaptics } from '@/lib/haptics';
import { ensureLocationPermission, watchLocation } from '@/lib/location';
import { speakCue, speakText, stopSpeech } from '@/lib/speech';
import { useScreenReader } from '@/lib/useScreenReader';
import { useApp } from '@/state/AppProvider';
import type { LatLng } from '@/types';
import { BottomDock } from '@/ui/components/BottomDock';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { ErrorNotice } from '@/ui/components/ErrorNotice';
import { Header } from '@/ui/components/Header';
import { IconButton } from '@/ui/components/IconButton';
import { InstructionStage } from '@/ui/components/InstructionStage';
import { ProgressRail } from '@/ui/components/ProgressRail';
import { RouteSketch } from '@/ui/components/RouteSketch';
import { Screen } from '@/ui/components/Screen';
import { Sheet } from '@/ui/components/Sheet';
import { layout, radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

const SIM_SPEED = 6;

export default function GuideScreen() {
  const router = useRouter();
  const { prefs, route, setRoute } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const screenReader = useScreenReader();
  useKeepAwake();

  const lang = prefs.lang;
  const [mode, setMode] = useState<'sim' | 'gps'>('sim');
  const [position, setPosition] = useState<LatLng | null>(route?.points[0] ?? null);
  const [progress, setProgress] = useState(0);
  const [fired, setFired] = useState<Set<string>>(new Set());
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [arrived, setArrived] = useState(false);

  const spokenRef = useRef<string | null>(null);
  const simulatedDistance = useRef(0);

  useEffect(() => {
    setPosition(route?.points[0] ?? null);
    setProgress(0);
    setFired(new Set());
    setArrived(false);
    setGpsError(null);
    spokenRef.current = null;
    simulatedDistance.current = 0;
  }, [route?.route_id]);

  useEffect(() => {
    if (!route || mode !== 'sim') return;
    const total = pathLengthM(route.points);
    simulatedDistance.current = 0;
    const timer = setInterval(() => {
      simulatedDistance.current = Math.min(
        total,
        simulatedDistance.current + 1.4 * SIM_SPEED * 0.5,
      );
      const nextPosition = pointAtDistance(route.points, simulatedDistance.current);
      setPosition(nextPosition);
      setProgress(total === 0 ? 1 : simulatedDistance.current / total);
      if (simulatedDistance.current >= total) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [route, mode]);

  useEffect(() => {
    if (!route || mode !== 'gps') return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    (async () => {
      subscription = await watchLocation(
        (nextPosition) => {
          if (cancelled) return;
          setPosition(nextPosition);
          setProgress(progressOnRoute(route, nextPosition));
        },
        (reason) => {
          if (cancelled) return;
          setGpsError(reason === 'permission' ? t(lang, 'permissionDenied') : t(lang, 'gpsError'));
          setMode('sim');
        },
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [route, mode, lang]);

  useEffect(() => {
    if (!route || !position) return;
    const cue = cueToFire(route, position, fired);
    if (!cue) return;

    setFired((current) => {
      const next = new Set(current);
      next.add(cue.id);
      return next;
    });

    if (spokenRef.current !== cue.id) {
      spokenRef.current = cue.id;
      playHaptic(cue.haptic, prefs.haptics);
      speakCue(cue, route.language, prefs.voiceRate, screenReader);
    }
  }, [route, position, fired, prefs.haptics, prefs.voiceRate, screenReader]);

  useEffect(() => {
    if (!route || progress <= 0) return;
    const arrival = route.cues[route.cues.length - 1];
    if (arrival?.kind !== 'ARRIVE') return;
    if (alongRouteM(route, arrival.at) - progress * pathLengthM(route.points) <= 6) {
      setArrived(true);
    }
  }, [route, progress]);

  if (!route) {
    return (
      <Screen padded>
        <Header lang={lang} title={t(lang, 'guideNoRoute')} onBack={() => router.replace('/')} />
        <Card style={styles.emptyCard}>
          <Text
            style={[styles.emptyText, { color: theme.textMuted, fontSize: fs(16) }]}
            maxFontSizeMultiplier={1.6}
          >
            {t(lang, 'planningSubtitle')}
          </Text>
          <Button
            label={t(lang, 'planRoute')}
            onPress={() => router.replace('/')}
            fullWidth
            style={{ marginTop: space.md }}
          />
        </Card>
      </Screen>
    );
  }

  const totalPath = pathLengthM(route.points);
  const along = progress * totalPath;
  const cueAlong = route.cues.map((item) => alongRouteM(route, item.at));
  let displayIndex = cueAlong.findIndex((value) => value >= along - 6);
  if (displayIndex < 0) displayIndex = route.cues.length - 1;
  const cue = route.cues[displayIndex] ?? route.cues[0];
  const distance = Math.max(0, (cueAlong[displayIndex] ?? totalPath) - along);
  const tone = toneFor(cue, distance);
  const upcoming = nextCue(route, cue.id);
  const remaining = Math.max(0, route.distance_m * (1 - progress));
  const remainingSeconds = Math.max(0, route.duration_s * (1 - progress));

  const finish = () => {
    stopSpeech();
    stopHaptics();
    setRoute(null);
    router.replace('/');
  };

  const askToEnd = () => {
    Alert.alert(t(lang, 'endConfirmTitle'), t(lang, 'endConfirmBody'), [
      { text: t(lang, 'cancel'), style: 'cancel' },
      { text: t(lang, 'end'), style: 'destructive', onPress: finish },
    ]);
  };

  const repeatCue = () => {
    playHaptic(cue.haptic, prefs.haptics);
    speakCue(cue, route.language, prefs.voiceRate, screenReader);
  };

  const toggleMode = async () => {
    if (mode === 'gps') {
      setMode('sim');
      return;
    }
    const granted = await ensureLocationPermission();
    if (!granted) {
      Alert.alert(t(lang, 'gpsPermissionTitle'), t(lang, 'gpsPermissionBody'));
      return;
    }
    setGpsError(null);
    setMode('gps');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Screen padded={false} scroll={false}>
        <View
          style={[
            styles.topRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <IconButton
            label={t(lang, 'endRoute')}
            variant="ghost"
            onPress={askToEnd}
            icon={(color) => <X size={24} color={color} />}
          />
          <View style={styles.metrics}>
            <Text
              style={[styles.metric, { color: theme.text, fontSize: fs(15) }]}
              maxFontSizeMultiplier={1.5}
            >
              {formatDuration(remainingSeconds, lang)} · {formatDistance(remaining, lang)}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.destination, { color: theme.textMuted, fontSize: fs(12) }]}
              maxFontSizeMultiplier={1.4}
            >
              {route.destination.name}
            </Text>
          </View>
          <Pressable
            onPress={() => void toggleMode()}
            accessibilityRole="button"
            accessibilityLabel={mode === 'sim' ? t(lang, 'demoMode') : t(lang, 'gpsMode')}
            style={({ pressed }) => [
              styles.modePill,
              {
                backgroundColor: theme.surfaceRaised,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <LocateFixed size={15} color={mode === 'gps' ? theme.accent : theme.textMuted} />
            <Text
              style={[styles.modeText, { color: theme.text, fontSize: fs(12) }]}
              maxFontSizeMultiplier={1.4}
            >
              {mode === 'sim' ? t(lang, 'simulate') : t(lang, 'gps')}
            </Text>
          </Pressable>
        </View>

        {gpsError ? (
          <View style={styles.noticeWrap}>
            <ErrorNotice
              title={t(lang, 'gpsError')}
              message={gpsError}
              actionLabel={t(lang, 'simulate')}
              onAction={() => {
                setGpsError(null);
                setMode('sim');
              }}
            />
          </View>
        ) : null}

        <InstructionStage cue={cue} distanceM={distance} tone={tone} lang={lang} />

        <View style={styles.bottomArea}>
          <ProgressRail
            cues={route.cues}
            activeCueId={cue.id}
            progress={progress}
            lang={lang}
          />
          <View style={styles.nextRow}>
            <Text
              style={[styles.nextLabel, { color: theme.textMuted, fontSize: fs(12) }]}
              maxFontSizeMultiplier={1.5}
            >
              {t(lang, 'next')}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.nextText, { color: theme.textMuted, fontSize: fs(14) }]}
              maxFontSizeMultiplier={1.5}
            >
              {upcoming ? upcoming.short : route.destination.name}
            </Text>
          </View>
          {route.provider === 'google' ? (
            <Text
              style={[
                styles.attribution,
                {
                  color: theme.textMuted,
                  fontSize: fs(10),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              maxFontSizeMultiplier={1.4}
            >
              Powered by Google
            </Text>
          ) : null}
        </View>
      </Screen>

      <BottomDock>
        <Button
          label={t(lang, 'repeat')}
          variant="secondary"
          onPress={repeatCue}
          icon={(color) => <RotateCcw size={20} color={color} />}
          style={styles.dockButton}
        />
        <Button
          label={t(lang, 'map')}
          variant="secondary"
          onPress={() => setMapOpen(true)}
          icon={(color) => <Map size={20} color={color} />}
          style={styles.dockButton}
        />
        <Button
          label={t(lang, 'end')}
          accessibilityLabel={t(lang, 'endRoute')}
          accessibilityHint={t(lang, 'holdToEnd')}
          variant="danger"
          onPress={askToEnd}
          onLongPress={finish}
          icon={(color) => <Square size={18} color={color} />}
          style={styles.dockButton}
        />
      </BottomDock>

      <Sheet visible={mapOpen} onClose={() => setMapOpen(false)} title={t(lang, 'route')}>
        <RouteSketch route={route} position={position} progress={progress} lang={lang} />
        <View
          style={[
            styles.metricsRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View>
            <Text style={[styles.metricLabel, { color: theme.textMuted, fontSize: fs(12) }]}>
              {t(lang, 'distanceLeft')}
            </Text>
            <Text style={[styles.metricValue, { color: theme.text, fontSize: fs(20) }]}>
              {formatDistance(remaining, lang)}
            </Text>
          </View>
          <View>
            <Text style={[styles.metricLabel, { color: theme.textMuted, fontSize: fs(12) }]}>
              {t(lang, 'eta')}
            </Text>
            <Text style={[styles.metricValue, { color: theme.text, fontSize: fs(20) }]}>
              {formatDuration(remainingSeconds, lang)}
            </Text>
          </View>
          <View>
            <Text style={[styles.metricLabel, { color: theme.textMuted, fontSize: fs(12) }]}>
              {t(lang, 'plannerMode')}
            </Text>
            <Text style={[styles.metricValue, { color: theme.text, fontSize: fs(16) }]}>
              {route.provider}
            </Text>
          </View>
        </View>
        {route.provider === 'google' ? (
          <Text
            style={[
              styles.attribution,
              {
                color: theme.textMuted,
                fontSize: fs(11),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.4}
          >
            Powered by Google
          </Text>
        ) : null}

        <Text
          style={[
            styles.sectionLabel,
            { color: theme.textMuted, fontSize: fs(12), textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {t(lang, 'steps')}
        </Text>
        {route.cues.map((item) => (
          <View
            key={item.id}
            style={[
              styles.stepRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: item.id === cue.id ? theme.accent : theme.border,
                },
              ]}
            />
            <View style={styles.flex}>
              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: theme.text,
                    fontSize: fs(15),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                maxFontSizeMultiplier={1.6}
              >
                {item.short}
              </Text>
              <Text
                style={[
                  styles.stepSay,
                  {
                    color: theme.textMuted,
                    fontSize: fs(13),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                maxFontSizeMultiplier={1.6}
              >
                {item.say}
              </Text>
            </View>
          </View>
        ))}
      </Sheet>

      {arrived ? (
        <View
          style={[styles.arrivedOverlay, { backgroundColor: theme.bg }]}
          accessibilityViewIsModal
        >
          <View style={[styles.arrivedIcon, { backgroundColor: theme.accentSoft }]}>
            <Check size={44} color={theme.accent} strokeWidth={3} />
          </View>
          <Text
            style={[styles.arrivedTitle, { color: theme.text, fontSize: fs(32) }]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'arrived')}
          </Text>
          <Text
            style={[styles.arrivedBody, { color: theme.textMuted, fontSize: fs(16) }]}
            maxFontSizeMultiplier={1.6}
          >
            {t(lang, 'arrivedBody')}
          </Text>
          <Text
            style={[styles.arrivedDest, { color: theme.accentText, fontSize: fs(18) }]}
            maxFontSizeMultiplier={1.6}
          >
            {route.destination.name}
          </Text>
          <Button
            label={t(lang, 'done')}
            onPress={finish}
            fullWidth
            style={{ marginTop: space.xl }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
  },
  metrics: { flex: 1 },
  metric: { fontFamily: fontFamily.mono, letterSpacing: 0 },
  destination: { fontFamily: fontFamily.regular, marginTop: 1 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  modeText: { fontFamily: fontFamily.medium },
  noticeWrap: { paddingHorizontal: layout.gutter, paddingTop: space.sm },
  bottomArea: {
    paddingHorizontal: layout.gutter,
    paddingBottom: layout.dockHeight + 22,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
  },
  nextLabel: { fontFamily: fontFamily.semibold },
  nextText: { fontFamily: fontFamily.regular, flex: 1 },
  dockButton: { flex: 1, paddingHorizontal: 8 },
  emptyCard: { marginTop: space.md, gap: space.sm },
  emptyText: { fontFamily: fontFamily.regular, lineHeight: 24 },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.md,
    marginBottom: space.md,
  },
  metricLabel: { fontFamily: fontFamily.medium },
  metricValue: { fontFamily: fontFamily.monoBold, marginTop: 2 },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    marginBottom: space.xs,
  },
  attribution: {
    fontFamily: fontFamily.regular,
    marginTop: 4,
    opacity: 0.8,
  },
  stepRow: {
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
  },
  stepDot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
  stepTitle: { fontFamily: fontFamily.semibold },
  stepSay: { fontFamily: fontFamily.regular, marginTop: 2, lineHeight: 19 },
  flex: { flex: 1 },
  arrivedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 50,
  },
  arrivedIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  arrivedTitle: { fontFamily: fontFamily.bold, textAlign: 'center' },
  arrivedBody: { fontFamily: fontFamily.regular, textAlign: 'center', marginTop: space.xs },
  arrivedDest: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
    marginTop: space.sm,
  },
});
