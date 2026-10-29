import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  const { theme, themeName, isRTL, fs } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.wrap,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.border,
          borderWidth: themeName === 'contrast' ? 2 : 1,
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              selected && { backgroundColor: theme.accent },
              pressed && !selected && { backgroundColor: theme.accentSoft },
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.4}
              style={[
                styles.label,
                {
                  color: selected ? theme.accentInk : theme.textMuted,
                  fontSize: fs(14),
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
  label: {
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
});
