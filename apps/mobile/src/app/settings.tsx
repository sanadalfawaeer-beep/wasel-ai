import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { API_URL, getHealth } from '@/lib/api';
import { t } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import type { Lang, Profile, TextScale, ThemeMode, VoiceRate } from '@/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { HapticLegend } from '@/ui/components/HapticLegend';
import { Header } from '@/ui/components/Header';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { SettingsRow } from '@/ui/components/SettingsRow';
import { TabBar } from '@/ui/components/TabBar';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme, isRTL, fs } = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.textMuted,
            fontSize: fs(13),
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}
        maxFontSizeMultiplier={1.5}
      >
        {title}
      </Text>
      <Card padding={0}>
        <View style={styles.sectionInner}>{children}</View>
      </Card>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { prefs, updatePrefs, resetOnboarding } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;
  const [health, setHealth] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const testBackend = async () => {
    setTesting(true);
    setHealth(null);
    try {
      const result = await getHealth();
      setHealth(`${t(lang, 'backendOk')} · ${result.mode}${result.model ? ` · ${result.model}` : ''}`);
    } catch {
      setHealth(t(lang, 'backendFail'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Screen scroll padded edges={['top', 'left', 'right']}>
        <Header
          lang={lang}
          title={t(lang, 'settings')}
          right={
            <IconButton
              label={t(lang, 'done')}
              onPress={() => router.replace('/')}
              icon={(color) => <Check size={22} color={color} />}
            />
          }
        />

        <Section title={t(lang, 'profile')}>
          <SegmentedControl<Profile>
            options={[
              { value: 'blind', label: t(lang, 'voiceGuide') },
              { value: 'deaf', label: t(lang, 'visualGuide') },
              { value: 'deafblind', label: t(lang, 'bothProfiles') },
            ]}
            value={prefs.profile}
            onChange={(profile) => updatePrefs({ profile })}
            label={t(lang, 'profile')}
          />
        </Section>

        <Section title={t(lang, 'language')}>
          <SegmentedControl<Lang>
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
            value={prefs.lang}
            onChange={(value) => updatePrefs({ lang: value })}
            label={t(lang, 'language')}
          />
        </Section>

        <Section title={t(lang, 'theme')}>
          <SegmentedControl<ThemeMode>
            options={[
              { value: 'auto', label: t(lang, 'auto') },
              { value: 'night', label: t(lang, 'night') },
              { value: 'daylight', label: t(lang, 'daylight') },
              { value: 'contrast', label: t(lang, 'contrast') },
            ]}
            value={prefs.themeMode}
            onChange={(value) => updatePrefs({ themeMode: value })}
            label={t(lang, 'theme')}
          />
          <SegmentedControl<TextScale>
            options={[
              { value: 1, label: '100%' },
              { value: 1.25, label: '125%' },
              { value: 1.5, label: '150%' },
              { value: 2, label: '200%' },
            ]}
            value={prefs.textScale}
            onChange={(value) => updatePrefs({ textScale: value })}
            label={t(lang, 'textSize')}
          />
        </Section>

        <Section title={t(lang, 'voice')}>
          <SegmentedControl<VoiceRate>
            options={[
              { value: 0.8, label: '0.8×' },
              { value: 1, label: '1×' },
              { value: 1.2, label: '1.2×' },
            ]}
            value={prefs.voiceRate}
            onChange={(value) => updatePrefs({ voiceRate: value })}
            label={t(lang, 'voiceRate')}
          />
        </Section>

        <Section title={t(lang, 'haptics')}>
          <SettingsRow label={t(lang, 'hapticsOn')} last>
            <Switch
              value={prefs.haptics}
              onValueChange={(value) => updatePrefs({ haptics: value })}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.surface}
              ios_backgroundColor={theme.border}
              accessibilityLabel={t(lang, 'hapticsOn')}
            />
          </SettingsRow>
          <HapticLegend lang={lang} enabled={prefs.haptics} />
        </Section>

        <Section title={t(lang, 'navigation')}>
          <SettingsRow label={t(lang, 'stepFree')}>
            <Switch
              value={prefs.stepFree}
              onValueChange={(value) => updatePrefs({ stepFree: value })}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.surface}
              ios_backgroundColor={theme.border}
              accessibilityLabel={t(lang, 'stepFree')}
            />
          </SettingsRow>
          <SettingsRow label={t(lang, 'avoidStairs')}>
            <Switch
              value={prefs.avoidStairs}
              onValueChange={(value) => updatePrefs({ avoidStairs: value })}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.surface}
              ios_backgroundColor={theme.border}
              accessibilityLabel={t(lang, 'avoidStairs')}
            />
          </SettingsRow>
          <SettingsRow label={t(lang, 'preferLit')} description={t(lang, 'navNote')} last>
            <Switch
              value={prefs.preferLit}
              onValueChange={(value) => updatePrefs({ preferLit: value })}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.surface}
              ios_backgroundColor={theme.border}
              accessibilityLabel={t(lang, 'preferLit')}
            />
          </SettingsRow>
        </Section>

        <Section title={t(lang, 'safety')}>
          <Text
            style={[
              styles.safety,
              {
                color: theme.textMuted,
                fontSize: fs(14),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.6}
          >
            {t(lang, 'safetyText')}
          </Text>
        </Section>

        <Section title={t(lang, 'about')}>
          <SettingsRow label={t(lang, 'version')}>
            <Text style={[styles.value, { color: theme.textMuted, fontSize: fs(13) }]}>
              {Constants.expoConfig?.version ?? '0.1.0'}
            </Text>
          </SettingsRow>
          <SettingsRow label={t(lang, 'apiUrl')}>
            <Text
              selectable
              numberOfLines={1}
              style={[styles.url, { color: theme.textMuted, fontSize: fs(11) }]}
            >
              {API_URL}
            </Text>
          </SettingsRow>
          <SettingsRow label={t(lang, 'testBackend')} last={!health}>
            <Button
              label={t(lang, 'test')}
              size="sm"
              variant="secondary"
              loading={testing}
              onPress={() => void testBackend()}
            />
          </SettingsRow>
          {health ? (
            <Text
              style={[
                styles.health,
                {
                  color: health.includes(t(lang, 'backendFail')) ? theme.danger : theme.accent,
                  fontSize: fs(12),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              maxFontSizeMultiplier={1.5}
            >
              {health}
            </Text>
          ) : null}
        </Section>

        <Button
          label={t(lang, 'resetOnboarding')}
          variant="secondary"
          fullWidth
          onPress={() => {
            resetOnboarding();
            router.push('/onboarding');
          }}
          style={styles.reset}
        />
        <View style={styles.bottomSpacer} />
      </Screen>
      <TabBar active="settings" lang={lang} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginBottom: space.lg },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    marginBottom: space.xs,
  },
  sectionInner: { paddingHorizontal: space.md },
  safety: { fontFamily: fontFamily.regular, lineHeight: 22, paddingVertical: space.md },
  value: { fontFamily: fontFamily.mono },
  url: { fontFamily: fontFamily.mono, maxWidth: 190 },
  health: { fontFamily: fontFamily.medium, paddingBottom: space.md },
  reset: { marginTop: space.xs },
  bottomSpacer: { height: 120 },
});
