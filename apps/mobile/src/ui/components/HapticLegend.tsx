import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/lib/translate';
import type { HapticPattern, Lang } from '@/types';
import { HAPTIC_DESCRIPTION, playHaptic } from '@/lib/haptics';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';
import { Button } from './Button';

const ROWS: HapticPattern[] = ['left', 'right', 'arrive', 'warn'];

const LABEL: Record<HapticPattern, { en: string; ar: string }> = {
  left: { en: 'Left', ar: 'يسار' },
  right: { en: 'Right', ar: 'يمين' },
  arrive: { en: 'Arrived', ar: 'وصلت' },
  warn: { en: 'Wrong way', ar: 'اتجاه خاطئ' },
  tick: { en: 'Tick', ar: 'نبضة' },
};

export function HapticLegend({ lang, enabled }: { lang: Lang; enabled: boolean }) {
  const { theme, isRTL, fs } = useTheme();

  return (
    <View style={styles.wrap}>
      {ROWS.map((pattern) => (
        <View
          key={pattern}
          style={[
            styles.row,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.text}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.text,
                  textAlign: isRTL ? 'right' : 'left',
                  fontSize: fs(15),
                },
              ]}
              maxFontSizeMultiplier={1.6}
            >
              {LABEL[pattern][lang]}
            </Text>
            <Text
              style={[
                styles.desc,
                {
                  color: theme.textMuted,
                  textAlign: isRTL ? 'right' : 'left',
                  fontSize: fs(12),
                },
              ]}
              maxFontSizeMultiplier={1.6}
            >
              {HAPTIC_DESCRIPTION[pattern][lang]}
            </Text>
          </View>
          <Button
            label={t(lang, 'test')}
            size="sm"
            variant="secondary"
            disabled={!enabled}
            onPress={() => playHaptic(pattern, enabled)}
            accessibilityLabel={`${t(lang, 'test')} ${LABEL[pattern][lang]}`}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    minHeight: 54,
  },
  text: { flex: 1 },
  label: { fontFamily: fontFamily.medium },
  desc: { fontFamily: fontFamily.regular, marginTop: 1 },
});
