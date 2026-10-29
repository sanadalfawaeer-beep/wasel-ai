import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { t } from '@/lib/translate';
import type { LatLng, Lang, RoutePlan } from '@/types';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

interface RouteSketchProps {
  route: RoutePlan;
  position?: LatLng | null;
  progress?: number;
  lang: Lang;
}

const WIDTH = 320;
const HEIGHT = 190;
const PAD = 24;

export function RouteSketch({ route, position, progress = 0, lang }: RouteSketchProps) {
  const { theme, fs, isRTL } = useTheme();
  const points = route.points;

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;

  const project = (point: LatLng) => ({
    x: PAD + ((point.lng - minLng) / lngSpan) * (WIDTH - PAD * 2),
    y: PAD + ((maxLat - point.lat) / latSpan) * (HEIGHT - PAD * 2),
  });

  const projected = points.map(project);
  const all = projected.map((point) => `${point.x},${point.y}`).join(' ');
  const travelled = Math.max(2, Math.ceil(progress * (projected.length - 1)) + 1);
  const active = projected
    .slice(0, Math.min(projected.length, travelled))
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  const start = projected[0];
  const end = projected[projected.length - 1];
  const current = position ? project(position) : null;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${t(lang, 'route')}: ${route.destination.name}`}
      style={styles.wrap}
    >
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Polyline
          points={all}
          fill="none"
          stroke={theme.border}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Polyline
          points={active}
          fill="none"
          stroke={theme.accent}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={start.x} cy={start.y} r={7} fill={theme.textMuted} />
        <Circle
          cx={end.x}
          cy={end.y}
          r={9}
          fill={theme.accent}
          stroke={theme.bg}
          strokeWidth={3}
        />
        {current ? (
          <Circle
            cx={current.x}
            cy={current.y}
            r={9}
            fill={theme.text}
            stroke={theme.accent}
            strokeWidth={3}
          />
        ) : null}
      </Svg>
      <View
        style={[
          styles.legend,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.textMuted }]} />
          <Text style={[styles.legendText, { color: theme.textMuted, fontSize: fs(12) }]}>
            {t(lang, 'start')}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[styles.destination, { color: theme.text, fontSize: fs(13) }]}
        >
          {route.destination.name}
        </Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.legendText, { color: theme.textMuted, fontSize: fs(12) }]}>
            {t(lang, 'destination')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fontFamily.medium },
  destination: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
  },
});
