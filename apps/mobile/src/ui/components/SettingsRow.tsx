import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

interface SettingsRowProps {
  label: string;
  description?: string;
  children?: ReactNode;
  last?: boolean;
}

export function SettingsRow({ label, description, children, last = false }: SettingsRowProps) {
  const { theme, isRTL, fs } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          borderBottomColor: theme.border,
          borderBottomWidth: last ? 0 : 1,
        },
      ]}
    >
      <View style={styles.text}>
        <Text
          maxFontSizeMultiplier={1.6}
          style={[
            styles.label,
            {
              color: theme.text,
              textAlign: isRTL ? 'right' : 'left',
              fontSize: fs(16),
            },
          ]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            maxFontSizeMultiplier={1.6}
            style={[
              styles.description,
              {
                color: theme.textMuted,
                textAlign: isRTL ? 'right' : 'left',
                fontSize: fs(13),
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {children ? <View style={styles.control}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: 56,
  },
  text: { flex: 1 },
  label: { fontFamily: fontFamily.medium },
  description: { fontFamily: fontFamily.regular, marginTop: 2, lineHeight: 19 },
  control: { alignItems: 'flex-end' },
});
