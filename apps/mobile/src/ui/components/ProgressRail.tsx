import { StyleSheet, View } from 'react-native';
import { t } from '@/lib/translate';
import type { Cue, Lang } from '@/types';
import { useTheme } from '@/ui/useTheme';

interface ProgressRailProps {
  cues: Cue[];
  activeCueId: string | null;
  progress: number;
  lang: Lang;
}

export function ProgressRail({ cues, activeCueId, progress, lang }: ProgressRailProps) {
  const { theme, isRTL } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  const activeIndex = Math.max(
    0,
    cues.findIndex((cue) => cue.id === activeCueId),
  );

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityLabel={t(lang, 'routeProgress')}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.track, { backgroundColor: theme.border }]} />
      <View
        style={[
          styles.fill,
          {
            backgroundColor: theme.accent,
            width: `${clamped * 100}%`,
            ...(isRTL ? { right: 0 } : { left: 0 }),
          },
        ]}
      />
      {cues.map((cue, index) => {
        const ratio = cues.length <= 1 ? 0 : index / (cues.length - 1);
        const current = cue.id === activeCueId;
        const past = index < activeIndex;
        const size = current ? 14 : past ? 8 : 7;
        return (
          <View
            key={cue.id}
            style={[
              styles.dot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: current
                  ? theme.accent
                  : past
                    ? theme.accent
                    : theme.surfaceRaised,
                borderColor: current ? theme.text : theme.border,
                borderWidth: current ? 2 : 1,
                ...(isRTL
                  ? { right: `${ratio * 100}%`, marginRight: -size / 2 }
                  : { left: `${ratio * 100}%`, marginLeft: -size / 2 }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  fill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    top: 5,
  },
});
