import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/ui/useTheme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, label, disabled = false }: ToggleProps) {
  const { theme, isRTL } = useTheme();
  const knobPosition = value
    ? isRTL
      ? 'flex-start'
      : 'flex-end'
    : isRTL
      ? 'flex-end'
      : 'flex-start';

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.track,
        {
          backgroundColor: value ? theme.accent : theme.border,
          borderColor: value ? theme.accent : theme.border,
          alignItems: knobPosition,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: theme.surface }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
