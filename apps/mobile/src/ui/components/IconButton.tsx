import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '@/ui/tokens';
import { useTheme } from '@/ui/useTheme';

interface IconButtonProps {
  label: string;
  onPress?: () => void;
  icon: (color: string) => ReactNode;
  size?: number;
  variant?: 'surface' | 'ghost' | 'accent';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  label,
  onPress,
  icon,
  size = 52,
  variant = 'surface',
  style,
  disabled = false,
}: IconButtonProps) {
  const { theme, themeName } = useTheme();
  const backgroundColor =
    variant === 'accent' ? theme.accent : variant === 'surface' ? theme.surfaceRaised : 'transparent';
  const color = variant === 'accent' ? theme.accentInk : theme.text;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor,
          borderColor: variant === 'ghost' ? 'transparent' : theme.border,
          borderWidth: variant === 'ghost' ? 0 : themeName === 'contrast' ? 2 : 1,
          opacity: disabled ? 0.4 : 1,
        },
        style,
        pressed && styles.pressed,
      ]}
    >
      {icon(color)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});
