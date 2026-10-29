import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';
import { Button } from './Button';

interface ErrorNoticeProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorNotice({ title, message, actionLabel, onAction }: ErrorNoticeProps) {
  const { theme, fs, isRTL } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.wrap,
        {
          backgroundColor: theme.dangerSoft,
          borderColor: theme.danger,
        },
      ]}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <AlertTriangle size={20} color={theme.danger} strokeWidth={2.4} />
        <Text
          maxFontSizeMultiplier={1.6}
          style={[
            styles.title,
            {
              color: theme.text,
              fontSize: fs(16),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {title}
        </Text>
      </View>
      <Text
        maxFontSizeMultiplier={1.6}
        style={[
          styles.message,
          {
            color: theme.textMuted,
            fontSize: fs(14),
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { fontFamily: fontFamily.semibold, flex: 1 },
  message: { fontFamily: fontFamily.regular, lineHeight: 21 },
  action: { alignSelf: 'flex-start', marginTop: space.xs },
});
