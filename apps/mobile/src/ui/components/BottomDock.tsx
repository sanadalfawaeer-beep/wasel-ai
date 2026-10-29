import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space } from '@/ui/tokens';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { useTheme } from '@/ui/useTheme';

interface BottomDockProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BottomDock({ children, style }: BottomDockProps) {
  const { theme, themeName, isRTL } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const useBlur = Platform.OS === 'ios' && themeName !== 'contrast' && !reducedMotion;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderTopColor: theme.border,
          backgroundColor: useBlur
            ? theme.mode === 'dark'
              ? 'rgba(13, 17, 23, 0.62)'
              : 'rgba(246, 247, 249, 0.72)'
            : theme.overlay,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        style,
      ]}
    >
      {useBlur ? (
        <BlurView
          intensity={38}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.content, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    zIndex: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
});
