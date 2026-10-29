import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { radius, space } from '@/ui/tokens';
import { useTheme } from '@/ui/useTheme';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  elevated = false,
  style,
  padding = space.lg,
}: CardProps) {
  const { theme, themeName } = useTheme();
  const base: ViewStyle = {
    backgroundColor: elevated ? theme.surfaceRaised : theme.surface,
    borderColor: theme.border,
    borderWidth: themeName === 'contrast' ? 2 : 1,
    borderRadius: radius.lg,
    padding,
    shadowColor: theme.shadow,
    shadowOpacity: themeName === 'contrast' ? 0 : 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: themeName === 'contrast' ? 0 : 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, style, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
});
