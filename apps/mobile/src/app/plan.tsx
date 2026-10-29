import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { planRoute } from '@/lib/api';
import { getCurrentLocationSafe } from '@/lib/location';
import { t } from '@/lib/translate';
import { demoRoute } from '@/fixtures/demoRoute';
import { useApp } from '@/state/AppProvider';
import type { AgentStep } from '@/types';
import { AgentPlan } from '@/ui/components/AgentPlan';
import { Card } from '@/ui/components/Card';
import { ErrorNotice } from '@/ui/components/ErrorNotice';
import { Header } from '@/ui/components/Header';
import { Screen } from '@/ui/components/Screen';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string | string[]; name?: string | string[] }>();
  const { prefs, setRoute } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;

  const paramText = Array.isArray(params.text) ? params.text[0] : params.text;
  const paramName = Array.isArray(params.name) ? params.name[0] : params.name;
  const text = paramText || (lang === 'ar' ? 'خذني إلى المكتبة' : 'Take me to the library');

  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const initial: AgentStep[] = [
      { id: 'heard', label: t(lang, 'heard'), detail: text, status: 'active' },
      { id: 'finding', label: t(lang, 'finding'), status: 'pending' },
      { id: 'route', label: t(lang, 'routeReady'), status: 'pending' },
      { id: 'cues', label: t(lang, 'preparing'), status: 'pending' },
    ];
    setSteps(initial);
    setError(null);
    setSlow(false);

    const stepTimer = setTimeout(() => {
      if (cancelled) return;
      setSteps((current) =>
        current.map((step) =>
          step.id === 'heard'
            ? { ...step, status: 'done' }
            : step.id === 'finding'
              ? { ...step, status: 'active' }
              : step,
        ),
      );
    }, 420);

    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, 3_500);

    (async () => {
      try {
        const origin = await getCurrentLocationSafe();
        const constraints = [
          ...(prefs.stepFree ? ['step_free'] : []),
          ...(prefs.avoidStairs ? ['avoid_stairs'] : []),
          ...(prefs.preferLit ? ['prefer_lit'] : []),
        ];

        const [response] = await Promise.all([
          planRoute({
            text,
            lat: origin.lat,
            lng: origin.lng,
            lang,
            constraints,
          }),
          wait(900),
        ]);

        if (cancelled) return;
        setSteps((current) =>
          current.map((step) => ({
            ...step,
            status: 'done' as const,
            detail:
              step.id === 'route'
                ? `${response.route.destination.name} · ${Math.round(response.route.distance_m / 10) * 10} m`
                : step.id === 'cues'
                  ? `${response.route.cues.length} cues`
                  : step.detail,
          })),
        );
        setRoute(response.route);
        await wait(300);
        if (!cancelled) router.replace('/guide');
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : t(lang, 'planFailedBody');
        setError(message);
        setSteps((current) =>
          current.map((step) =>
            step.status === 'pending' ? step : step.status === 'active' ? { ...step, status: 'error' } : step,
          ),
        );
      } finally {
        clearTimeout(stepTimer);
        clearTimeout(slowTimer);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(stepTimer);
      clearTimeout(slowTimer);
    };
    // `attempt` re-runs the planner; preferences are read at request time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, text, lang, router, setRoute]);

  const useDemo = () => {
    setRoute(demoRoute(lang));
    router.replace('/guide');
  };

  return (
    <Screen scroll padded>
      <Header
        lang={lang}
        title={t(lang, 'planningTitle')}
        subtitle={t(lang, 'planningSubtitle')}
        onBack={() => router.back()}
      />

      <Card style={styles.heardCard}>
        <Text
          style={[
            styles.kicker,
            {
              color: theme.textMuted,
              fontSize: fs(12),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          maxFontSizeMultiplier={1.5}
        >
          {t(lang, 'heard')}
        </Text>
        <Text
          style={[
            styles.query,
            {
              color: theme.text,
              fontSize: fs(20),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}
          maxFontSizeMultiplier={1.6}
        >
          {text}
        </Text>
        {paramName ? (
          <Text
            style={[
              styles.destination,
              {
                color: theme.accent,
                fontSize: fs(13),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {paramName}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.planCard}>
        <AgentPlan steps={steps} />
        {slow && !error ? (
          <Text
            style={[
              styles.slow,
              {
                color: theme.textMuted,
                fontSize: fs(13),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {t(lang, 'stillWorking')}
          </Text>
        ) : null}
      </Card>

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorNotice
            title={t(lang, 'planFailed')}
            message={`${error} ${t(lang, 'planFailedBody')}`}
            actionLabel={t(lang, 'retry')}
            onAction={() => setAttempt((value) => value + 1)}
          />
          <Text
            onPress={useDemo}
            accessibilityRole="button"
            style={[
              styles.demoLink,
              {
                color: theme.accent,
                fontSize: fs(15),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'useDemo')}
          </Text>
          <Text
            style={[
              styles.demoNote,
              {
                color: theme.textMuted,
                fontSize: fs(12),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {t(lang, 'demoRouteNote')}
          </Text>
        </View>
      ) : (
        <Text
          onPress={useDemo}
          accessibilityRole="button"
          style={[
            styles.demoLink,
            {
              color: theme.textMuted,
              fontSize: fs(13),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {t(lang, 'useDemo')}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heardCard: { gap: 4 },
  kicker: { fontFamily: fontFamily.semibold },
  query: { fontFamily: fontFamily.semibold, lineHeight: 28 },
  destination: { fontFamily: fontFamily.medium, marginTop: 4 },
  planCard: { marginTop: space.md },
  slow: { fontFamily: fontFamily.regular, marginTop: space.xs },
  errorWrap: { marginTop: space.md, gap: space.sm },
  demoLink: {
    fontFamily: fontFamily.semibold,
    marginTop: space.md,
    textDecorationLine: 'underline',
  },
  demoNote: { fontFamily: fontFamily.regular, marginTop: -4 },
});
