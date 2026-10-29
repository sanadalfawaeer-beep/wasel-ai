import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/lib/translate';
import type { Lang } from '@/types';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';
import { BrandMark } from './BrandMark';
import { IconButton } from './IconButton';

interface HeaderProps {
  lang: Lang;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  brand?: boolean;
}

export function Header({ lang, title, subtitle, onBack, right, brand = false }: HeaderProps) {
  const { theme, isRTL, fs } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {brand ? (
          <View style={[styles.brand, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <BrandMark size={32} />
            <View>
              <Text
                maxFontSizeMultiplier={1.4}
                style={[styles.brandName, { color: theme.text, fontSize: fs(18) }]}
              >
                {t(lang, 'appName')}
              </Text>
              <Text
                maxFontSizeMultiplier={1.4}
                style={[styles.brandTag, { color: theme.textMuted, fontSize: fs(11) }]}
              >
                {t(lang, 'tagline')}
              </Text>
            </View>
          </View>
        ) : onBack ? (
          <IconButton
            label={t(lang, 'back')}
            variant="ghost"
            onPress={onBack ?? (() => router.back())}
            icon={(color) =>
              isRTL ? <ChevronRight size={24} color={color} /> : <ChevronLeft size={24} color={color} />
            }
          />
        ) : (
          <View style={styles.spacer} />
        )}

        {!brand && title ? (
          <View style={styles.titleWrap}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.5}
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontSize: fs(20),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.5}
                style={[
                  styles.subtitle,
                  {
                    color: theme.textMuted,
                    fontSize: fs(12),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.right, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {right}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: space.sm, paddingBottom: space.md },
  row: { alignItems: 'center', justifyContent: 'space-between', gap: space.xs, minHeight: 52 },
  brand: { alignItems: 'center', gap: space.xs, flex: 1 },
  brandName: { fontFamily: fontFamily.bold, letterSpacing: 0.2 },
  brandTag: { fontFamily: fontFamily.regular, marginTop: -1 },
  spacer: { width: 44 },
  titleWrap: { flex: 1, paddingHorizontal: space.xs },
  title: { fontFamily: fontFamily.semibold },
  subtitle: { fontFamily: fontFamily.regular, marginTop: 1 },
  right: { alignItems: 'center', gap: space.xs },
});
