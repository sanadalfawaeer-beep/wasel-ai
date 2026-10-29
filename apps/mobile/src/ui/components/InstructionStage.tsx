import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { formatDistance } from '@/i18n';
import type { Cue, Lang } from '@/types';
import { space, type as typeScale } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useTheme } from '@/ui/useTheme';
import { ManeuverArrow } from './ManeuverArrow';

interface InstructionStageProps {
  cue: Cue;
  distanceM: number;
  tone: 'normal' | 'imminent' | 'critical';
  lang: Lang;
}

export function InstructionStage({ cue, distanceM, tone, lang }: InstructionStageProps) {
  const { theme, fs } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    progress.setValue(reducedMotion ? 1 : 0);
    if (!reducedMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [cue.id, progress, reducedMotion]);

  const toneColor =
    tone === 'critical' ? theme.danger : tone === 'imminent' ? theme.warn : theme.accent;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
      accessible
      accessibilityLabel={`${formatDistance(distanceM, lang)}. ${cue.short}. ${cue.say}`}
    >
      <Text
        maxFontSizeMultiplier={2}
        style={[
          styles.distance,
          {
            color: toneColor,
            fontSize: fs(typeScale.distance),
            lineHeight: fs(typeScale.distance) * 1.05,
          },
        ]}
      >
        {formatDistance(distanceM, lang)}
      </Text>

      <View style={styles.arrowWrap}>
        <ManeuverArrow kind={cue.kind} size={Math.min(148, fs(112))} color={toneColor} />
      </View>

      <Text
        maxFontSizeMultiplier={1.8}
        style={[
          styles.short,
          {
            color: theme.text,
            fontSize: fs(38),
            lineHeight: fs(38) * 1.14,
          },
        ]}
      >
        {cue.short}
      </Text>

      <Text
        maxFontSizeMultiplier={1.6}
        style={[
          styles.say,
          {
            color: theme.textMuted,
            fontSize: fs(17),
            lineHeight: fs(17) * 1.5,
          },
        ]}
      >
        {cue.detail || cue.say}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  distance: {
    fontFamily: fontFamily.monoBold,
    letterSpacing: 0,
  },
  arrowWrap: {
    marginVertical: space.sm,
  },
  short: {
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
    letterSpacing: 0,
  },
  say: {
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: space.sm,
    maxWidth: 340,
  },
});
