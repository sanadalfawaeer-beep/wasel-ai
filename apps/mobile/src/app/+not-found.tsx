import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import { Button } from '@/ui/components/Button';
import { Screen } from '@/ui/components/Screen';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

export default function NotFoundScreen() {
  const router = useRouter();
  const { prefs } = useApp();
  const { theme, fs } = useTheme();
  return (
    <Screen padded>
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: theme.text, fontSize: fs(24) }]}>
          {t(prefs.lang, 'routeUnavailable')}
        </Text>
        <Button
          label={t(prefs.lang, 'home')}
          onPress={() => router.replace('/')}
          fullWidth
          style={{ marginTop: space.md }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: fontFamily.semibold, textAlign: 'center' },
});
