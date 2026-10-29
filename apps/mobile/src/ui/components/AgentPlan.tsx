import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Check, Circle } from 'lucide-react-native';
import type { AgentStep, AgentStepStatus } from '@/types';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useTheme } from '@/ui/useTheme';

interface AgentPlanProps {
  steps: AgentStep[];
}

const STATUS_LABEL: Record<AgentStepStatus, string> = {
  pending: 'Pending',
  active: 'In progress',
  done: 'Done',
  error: 'Failed',
};

function StepRow({ step, index }: { step: AgentStep; index: number }) {
  const { theme, fs, isRTL } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    progress.setValue(reducedMotion ? 1 : 0);
    if (!reducedMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    }
  }, [index, progress, reducedMotion]);

  const color =
    step.status === 'done'
      ? theme.accent
      : step.status === 'error'
        ? theme.danger
        : step.status === 'active'
          ? theme.info
          : theme.textMuted;

  return (
    <Animated.View
      style={[
        styles.row,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
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
      accessibilityLabel={`${step.label}. ${STATUS_LABEL[step.status]}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        {step.status === 'active' ? (
          <ActivityIndicator size="small" color={color} />
        ) : step.status === 'done' ? (
          <Check size={18} color={color} strokeWidth={2.5} />
        ) : step.status === 'error' ? (
          <AlertCircle size={18} color={color} strokeWidth={2.5} />
        ) : (
          <Circle size={14} color={color} strokeWidth={2} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text
          maxFontSizeMultiplier={1.6}
          style={[
            styles.label,
            {
              color: step.status === 'pending' ? theme.textMuted : theme.text,
              fontSize: fs(18),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {step.label}
        </Text>
        {step.detail ? (
          <Text
            maxFontSizeMultiplier={1.6}
            style={[
              styles.detail,
              {
                color: theme.textMuted,
                fontSize: fs(14),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {step.detail}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function AgentPlan({ steps }: AgentPlanProps) {
  return (
    <View accessibilityLiveRegion="polite">
      {steps.map((step, index) => (
        <StepRow key={step.id} step={step} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { fontFamily: fontFamily.medium },
  detail: { fontFamily: fontFamily.regular, marginTop: 2 },
});
