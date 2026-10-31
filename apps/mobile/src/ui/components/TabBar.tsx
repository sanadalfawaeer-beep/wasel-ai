import { useRouter } from 'expo-router';
import { Bus, Home, MessageSquare, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/lib/translate';
import type { Lang } from '@/types';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

type Tab = 'home' | 'bus' | 'converse' | 'settings';

const ITEMS: Array<{
  key: Tab;
  route: string;
  label: 'home' | 'bus' | 'converse' | 'settings';
  icon: typeof Home;
}> = [
  { key: 'home', route: '/', label: 'home', icon: Home },
  { key: 'bus', route: '/bus', label: 'bus', icon: Bus },
  { key: 'converse', route: '/converse', label: 'converse', icon: MessageSquare },
  { key: 'settings', route: '/settings', label: 'settings', icon: Settings },
];

export function TabBar({ active, lang }: { active: Tab; lang: Lang }) {
  const { theme, fs, isRTL } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      {ITEMS.map((item) => {
        const selected = item.key === active;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.route as never)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={t(lang, item.label)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
          >
            <Icon
              size={22}
              color={selected ? theme.accentText : theme.textMuted}
              strokeWidth={selected ? 2.6 : 2}
            />
            <Text
              maxFontSizeMultiplier={1.4}
              style={[
                styles.label,
                {
                  color: selected ? theme.accentText : theme.textMuted,
                  fontSize: fs(12),
                },
              ]}
            >
              {t(lang, item.label)}
            </Text>
          </Pressable>
        );
      })}
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
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: space.md,
    zIndex: 30,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: { fontFamily: fontFamily.medium },
});
