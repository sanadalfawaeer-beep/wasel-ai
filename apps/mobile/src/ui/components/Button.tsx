import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { layout, radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: (color: string) => ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const HEIGHTS: Record<Size, number> = {
  sm: 44,
  md: 56,
  lg: layout.primaryTarget,
};

export function Button({
  label,
  onPress,
  onLongPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { theme, themeName, fs } = useTheme();

  const palette =
    variant === 'primary'
      ? { bg: theme.accent, fg: theme.accentInk, border: theme.accent }
      : variant === 'danger'
        ? { bg: theme.danger, fg: theme.dangerInk, border: theme.danger }
        : variant === 'secondary'
          ? { bg: theme.surfaceRaised, fg: theme.text, border: theme.border }
          : { bg: 'transparent', fg: theme.text, border: 'transparent' };

  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      onLongPress={inactive ? undefined : onLongPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHTS[size],
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: themeName === 'contrast' ? 2 : 1,
          opacity: inactive ? 0.45 : 1,
          paddingHorizontal: size === 'sm' ? space.md : space.xl,
        },
        fullWidth && styles.fullWidth,
        style,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon?.(palette.fg)}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.6}
            style={[
              styles.label,
              {
                color: palette.fg,
                fontSize: fs(size === 'sm' ? 14 : 17),
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.md,
  },
  fullWidth: { width: '100%' },
  label: {
    fontFamily: fontFamily.semibold,
    letterSpacing: 0,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
