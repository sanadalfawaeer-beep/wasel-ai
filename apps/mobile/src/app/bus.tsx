import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bus, Clock, Footprints, RefreshCw, Users } from 'lucide-react-native';
import { planTransit } from '@/lib/api';
import { getCurrentLocationSafe } from '@/lib/location';
import { formatDuration, t } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import type { Lang, OccupancyLevel, TransitItinerary, TransitLeg, TransitPlanResponse } from '@/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { ErrorNotice } from '@/ui/components/ErrorNotice';
import { Header } from '@/ui/components/Header';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { TabBar } from '@/ui/components/TabBar';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

const QUICK_DESTINATIONS: Array<'cityMall' | 'downtown' | 'abdoun' | 'ujLibrary'> = [
  'cityMall',
  'downtown',
  'abdoun',
  'ujLibrary',
];

function countdown(iso: string | null | undefined, now: number, lang: Lang): string {
  if (!iso) return '—';
  const minutes = Math.ceil((new Date(iso).getTime() - now) / 60_000);
  if (!Number.isFinite(minutes)) return '—';
  if (minutes <= 0) return t(lang, 'due');
  return `${minutes} ${t(lang, 'minutesShort')}`;
}

function OccupancyChip({ leg }: { leg: TransitLeg }) {
  const { theme, fs } = useTheme();
  const lang = useApp().prefs.lang;
  const level: OccupancyLevel = leg.occupancy ?? 'unknown';
  const color =
    level === 'seats'
      ? theme.accent
      : level === 'standing'
        ? theme.warn
        : level === 'full'
          ? theme.danger
          : theme.textMuted;
  const background =
    level === 'seats'
      ? theme.accentSoft
      : level === 'standing'
        ? theme.warnSoft
        : level === 'full'
          ? theme.dangerSoft
          : theme.surfaceRaised;

  const label =
    level === 'seats' && leg.seats_left != null
      ? `${leg.seats_left} ${t(lang, 'seatsLeft')}`
      : level === 'seats'
        ? t(lang, 'seatsLeft')
        : level === 'standing'
          ? t(lang, 'standing')
          : level === 'full'
            ? t(lang, 'fullBus')
            : t(lang, 'occupancyUnavailable');

  return (
    <View style={styles.occupancyWrap}>
      <View style={[styles.occupancy, { backgroundColor: background, borderColor: color }]}>
        <Users size={13} color={color} />
        <Text
          maxFontSizeMultiplier={1.4}
          style={[styles.occupancyText, { color, fontSize: fs(11) }]}
        >
          {label}
        </Text>
      </View>
      {leg.occupancy_source === 'simulated' ? (
        <Text
          style={[styles.source, { color: theme.textMuted, fontSize: fs(10) }]}
          maxFontSizeMultiplier={1.3}
        >
          {t(lang, 'simulated')}
        </Text>
      ) : leg.occupancy_source === 'reported' ? (
        <Text
          style={[styles.source, { color: theme.textMuted, fontSize: fs(10) }]}
          maxFontSizeMultiplier={1.3}
        >
          {t(lang, 'reported')}
        </Text>
      ) : null}
    </View>
  );
}

function WalkRow({ leg, nextBus, lang }: { leg: TransitLeg; nextBus?: TransitLeg; lang: Lang }) {
  const { theme, fs } = useTheme();
  return (
    <View style={[styles.legRow, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
      <View style={[styles.legIcon, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        <Footprints size={17} color={theme.textMuted} />
      </View>
      <View style={styles.flex}>
        <Text
          maxFontSizeMultiplier={1.5}
          style={[
            styles.legTitle,
            {
              color: theme.text,
              fontSize: fs(14),
              textAlign: lang === 'ar' ? 'right' : 'left',
            },
          ]}
        >
          {t(lang, 'walkToStop')} · {formatDuration(leg.duration_s, lang)}
        </Text>
        {nextBus?.board_stop ? (
          <Text
            maxFontSizeMultiplier={1.5}
            style={[
              styles.legDetail,
              {
                color: theme.textMuted,
                fontSize: fs(12),
                textAlign: lang === 'ar' ? 'right' : 'left',
              },
            ]}
          >
            {nextBus.board_stop}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function BusRow({ leg, now, lang }: { leg: TransitLeg; now: number; lang: Lang }) {
  const { theme, fs } = useTheme();
  const lineColor = leg.line_color ?? theme.accent;
  const line = leg.line_short ?? leg.line ?? '—';
  return (
    <View
      accessible
      accessibilityLabel={`${t(lang, 'takeBus')} ${line}. ${leg.board_stop ?? ''} ${
        t(lang, 'getOffAt')
      } ${leg.alight_stop ?? ''}. ${t(lang, 'nextBus')} ${countdown(
        leg.departure_at,
        now,
        lang,
      )}.`}
      style={[
        styles.busRow,
        { borderColor: lineColor, backgroundColor: theme.surfaceRaised },
      ]}
    >
      <View style={[styles.busTop, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
        <View
          style={[
            styles.lineBadge,
            { backgroundColor: theme.accentSoft, borderColor: lineColor },
          ]}
        >
          <Bus size={13} color={lineColor} />
          <Text
            numberOfLines={1}
            style={[styles.lineText, { color: lineColor, fontSize: fs(12) }]}
            maxFontSizeMultiplier={1.3}
          >
            {line}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text
            numberOfLines={2}
            style={[
              styles.busTitle,
              {
                color: theme.text,
                fontSize: fs(15),
                textAlign: lang === 'ar' ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {leg.headsign ?? leg.line ?? t(lang, 'bus')}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.busStops,
              {
                color: theme.textMuted,
                fontSize: fs(12),
                textAlign: lang === 'ar' ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {leg.board_stop ?? '—'} → {leg.alight_stop ?? '—'}
          </Text>
        </View>
        <View style={styles.countdownWrap}>
          <Text
            style={[styles.countdown, { color: theme.accent, fontSize: fs(16) }]}
            maxFontSizeMultiplier={1.4}
          >
            {countdown(leg.departure_at, now, lang)}
          </Text>
          <Text
            style={[styles.countdownLabel, { color: theme.textMuted, fontSize: fs(10) }]}
            maxFontSizeMultiplier={1.3}
          >
            {t(lang, 'nextBus')}
          </Text>
        </View>
      </View>

      <View style={[styles.busMeta, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
        <View style={styles.metaItem}>
          <Clock size={13} color={theme.textMuted} />
          <Text style={[styles.metaText, { color: theme.textMuted, fontSize: fs(11) }]}>
            {leg.num_stops} {t(lang, 'stops')}
          </Text>
        </View>
        <OccupancyChip leg={leg} />
      </View>
    </View>
  );
}

function ItineraryCard({
  itinerary,
  now,
  lang,
}: {
  itinerary: TransitItinerary;
  now: number;
  lang: Lang;
}) {
  const { theme, fs } = useTheme();
  const firstBus = itinerary.legs.find(
    (leg) => leg.mode !== 'WALK' && Boolean(leg.departure_at),
  );
  const firstMinutes = firstBus?.departure_at
    ? Math.max(0, Math.ceil((new Date(firstBus.departure_at).getTime() - now) / 60_000))
    : null;
  const departures =
    firstMinutes != null
      ? [firstMinutes, firstMinutes + 10, firstMinutes + 20]
      : itinerary.next_departures_min;
  const transferLabel =
    itinerary.transfers === 0
      ? t(lang, 'direct')
      : `${itinerary.transfers} ${
          itinerary.transfers === 1 ? t(lang, 'transfer') : t(lang, 'transfers')
        }`;
  const statusLabel = itinerary.demo
    ? t(lang, 'simulated')
    : itinerary.realtime
      ? t(lang, 'live')
      : t(lang, 'estimated');
  const statusColor = itinerary.demo || !itinerary.realtime ? theme.warn : theme.accent;
  const statusBackground = itinerary.demo || !itinerary.realtime ? theme.warnSoft : theme.accentSoft;

  return (
    <Card style={styles.itineraryCard}>
      <View style={[styles.itineraryHeader, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
        <Text
          style={[styles.duration, { color: theme.text, fontSize: fs(24) }]}
          maxFontSizeMultiplier={1.6}
        >
          {formatDuration(itinerary.duration_s, lang)}
        </Text>
        <View style={[styles.badge, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
          <Text style={[styles.badgeText, { color: theme.textMuted, fontSize: fs(10) }]}>
            {transferLabel}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: statusBackground,
              borderColor: statusColor,
            },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: statusColor, fontSize: fs(10) }]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.summary,
          {
            color: theme.textMuted,
            fontSize: fs(12),
            textAlign: lang === 'ar' ? 'right' : 'left',
          },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {itinerary.summary}
      </Text>

      {itinerary.legs.map((leg, index) => {
        const nextLeg = itinerary.legs[index + 1];
        return leg.mode === 'WALK' ? (
          <WalkRow key={`${itinerary.id}-leg-${index}`} leg={leg} nextBus={nextLeg} lang={lang} />
        ) : (
          <BusRow key={`${itinerary.id}-leg-${index}`} leg={leg} now={now} lang={lang} />
        );
      })}

      {departures.length > 0 ? (
        <View style={[styles.departures, { flexDirection: lang === 'ar' ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.departuresLabel, { color: theme.textMuted, fontSize: fs(11) }]}>
            {t(lang, 'nextDepartures')}
          </Text>
          {departures.slice(0, 4).map((minutes) => (
            <View
              key={`${itinerary.id}-${minutes}`}
              style={[styles.departureChip, { borderColor: theme.border }]}
            >
              <Text style={[styles.departureText, { color: theme.text, fontSize: fs(11) }]}>
                {minutes === 0 ? t(lang, 'due') : `${minutes} ${t(lang, 'minutesShort')}`}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export default function BusScreen() {
  const { prefs } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;
  const [query, setQuery] = useState(() => t(prefs.lang, 'cityMall'));
  const [plan, setPlan] = useState<TransitPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const findBuses = async (text = query) => {
    const value = text.trim() || t(lang, 'cityMall');
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const origin = await getCurrentLocationSafe();
      const response = await planTransit({
        text: value,
        lat: origin.lat,
        lng: origin.lng,
        lang,
      });
      setPlan(response);
      setQuery(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(lang, 'busError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = t(lang, 'cityMall');
    setQuery(initial);
    void findBuses(initial);
    // The language is the only reason to reload the demo board.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Screen scroll padded edges={['top', 'left', 'right']}>
        <Header
          lang={lang}
          title={t(lang, 'bus')}
          subtitle={t(lang, 'busPlanner')}
          right={
            <IconButton
              label={t(lang, 'retry')}
              onPress={() => void findBuses(query)}
              icon={(color) => <RefreshCw size={20} color={color} />}
            />
          }
        />

        {plan?.demo ? (
          <View
            style={[
              styles.demoBanner,
              { backgroundColor: theme.warnSoft, borderColor: theme.warn },
            ]}
          >
            <Text
              style={[
                styles.demoText,
                {
                  color: theme.warn,
                  fontSize: fs(12),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              maxFontSizeMultiplier={1.5}
            >
              {t(lang, 'demoBusNote')}
            </Text>
          </View>
        ) : null}

        {plan?.provider === 'google' ? (
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
            Transit data from Google
          </Text>
        ) : null}

        <Card style={styles.searchCard}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void findBuses(query)}
            placeholder={t(lang, 'busPlaceholder')}
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            accessibilityLabel={t(lang, 'busPlaceholder')}
            style={[
              styles.input,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                color: theme.text,
                fontSize: fs(16),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          />
          <View style={[styles.quick, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {QUICK_DESTINATIONS.map((key) => {
              const label = t(lang, key);
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setQuery(label);
                    void findBuses(label);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  style={({ pressed }) => [
                    styles.quickChip,
                    {
                      backgroundColor: theme.surfaceRaised,
                      borderColor: theme.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.quickText, { color: theme.text, fontSize: fs(12) }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            label={t(lang, 'findBuses')}
            onPress={() => void findBuses(query)}
            loading={loading}
            fullWidth
            icon={(color) => <Bus size={20} color={color} />}
            style={styles.findButton}
          />
        </Card>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorWrap}>
            <ErrorNotice
              title={t(lang, 'busError')}
              message={error}
              actionLabel={t(lang, 'retry')}
              onAction={() => void findBuses(query)}
            />
          </View>
        ) : null}

        {plan && plan.itineraries.length === 0 ? (
          <Text
            style={[
              styles.empty,
              {
                color: theme.textMuted,
                fontSize: fs(15),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t(lang, 'noBusRoutes')}
          </Text>
        ) : null}

        {plan?.itineraries.map((itinerary) => (
          <ItineraryCard
            key={itinerary.id}
            itinerary={itinerary}
            now={now}
            lang={lang}
          />
        ))}

        {!plan && !loading && !error ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.legIcon, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                <Bus size={20} color={theme.accent} />
              </View>
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: theme.textMuted,
                    fontSize: fs(14),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                maxFontSizeMultiplier={1.5}
              >
                {t(lang, 'busCardBody')}
              </Text>
            </View>
          </Card>
        ) : null}

        <View style={styles.bottomSpacer} />
      </Screen>
      <TabBar active="bus" lang={lang} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  demoBanner: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  demoText: { fontFamily: fontFamily.medium, lineHeight: 18 },
  attribution: {
    fontFamily: fontFamily.regular,
    marginTop: -space.xs,
    marginBottom: space.sm,
    opacity: 0.8,
  },
  searchCard: { gap: space.sm },
  input: {
    minWidth: 0,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fontFamily.regular,
  },
  quick: { flexWrap: 'wrap', gap: space.xs },
  quickChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  quickText: { fontFamily: fontFamily.medium },
  findButton: { marginTop: space.xs },
  loadingWrap: { paddingVertical: space.xl, alignItems: 'center' },
  errorWrap: { marginTop: space.md },
  empty: { fontFamily: fontFamily.regular, marginTop: space.lg },
  emptyCard: { marginTop: space.md },
  emptyRow: { alignItems: 'center', gap: space.sm },
  emptyText: { fontFamily: fontFamily.regular, flex: 1, lineHeight: 21 },
  itineraryCard: { marginTop: space.md, gap: space.sm },
  itineraryHeader: { alignItems: 'center', gap: space.xs },
  duration: { fontFamily: fontFamily.bold },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fontFamily.medium },
  summary: { fontFamily: fontFamily.regular, lineHeight: 18 },
  legRow: { alignItems: 'center', gap: space.sm, paddingVertical: 3 },
  legIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legTitle: { fontFamily: fontFamily.medium },
  legDetail: { fontFamily: fontFamily.regular, marginTop: 1 },
  busRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.sm,
    gap: space.xs,
  },
  busTop: { alignItems: 'flex-start', gap: space.sm },
  lineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    minHeight: 34,
  },
  lineText: { fontFamily: fontFamily.bold },
  busTitle: { fontFamily: fontFamily.semibold },
  busStops: { fontFamily: fontFamily.regular, marginTop: 2, lineHeight: 17 },
  countdownWrap: { alignItems: 'flex-end' },
  countdown: { fontFamily: fontFamily.monoBold },
  countdownLabel: { fontFamily: fontFamily.medium, marginTop: 1 },
  busMeta: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: 2,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fontFamily.regular },
  occupancyWrap: { alignItems: 'flex-end', gap: 2 },
  occupancy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  occupancyText: { fontFamily: fontFamily.medium },
  source: { fontFamily: fontFamily.regular },
  departures: { alignItems: 'center', flexWrap: 'wrap', gap: space.xs, marginTop: 2 },
  departuresLabel: { fontFamily: fontFamily.medium },
  departureChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  departureText: { fontFamily: fontFamily.mono },
  bottomSpacer: { height: 120 },
  flex: { flex: 1 },
});
