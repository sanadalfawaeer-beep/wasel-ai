import { useRouter } from 'expo-router';
import { ArrowRight, Ear, Eye, Hand, Vibrate, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { playHaptic } from '@/lib/haptics';
import { speakText } from '@/lib/speech';
import { t } from '@/lib/translate';
import { useApp } from '@/state/AppProvider';
import type { Lang, Profile, ThemeMode } from '@/types';
import { BrandMark } from '@/ui/components/BrandMark';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { prefs, updatePrefs } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;
  const [step, setStep] = useState(0);

  const sample =
    lang === 'ar'
      ? 'بعد ٣٠ مترًا، انعطف يمينًا نحو مدخل المكتبة.'
      : 'In 30 meters, turn right toward the library entrance.';

  const finish = () => {
    updatePrefs({ onboarded: true });
    router.replace('/');
  };

  const profileOptions: Array<{
    value: Profile;
    icon: typeof Eye;
    title: string;
    body: string;
  }> = [
    {
      value: 'blind',
      icon: Eye,
      title: t(lang, 'voiceGuide'),
      body: t(lang, 'profileBlindBody'),
    },
    {
      value: 'deaf',
      icon: Ear,
      title: t(lang, 'visualGuide'),
      body: t(lang, 'profileDeafBody'),
    },
    {
      value: 'deafblind',
      icon: Hand,
      title: t(lang, 'bothProfiles'),
      body: t(lang, 'profileBothBody'),
    },
  ];

  return (
    <Screen scroll padded>
      <View style={[styles.top, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.brand, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <BrandMark size={34} />
          <Text style={[styles.brandText, { color: theme.text, fontSize: fs(17) }]}>
            {t(lang, 'appName')}
          </Text>
        </View>
        <Pressable
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel={t(lang, 'skip')}
          hitSlop={12}
        >
          <Text style={[styles.skip, { color: theme.textMuted, fontSize: fs(14) }]}>
            {t(lang, 'skip')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                width: index === step ? 22 : 8,
                backgroundColor: index <= step ? theme.accent : theme.border,
              },
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <BrandMark size={72} />
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
                fontSize: fs(34),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'onboardTitle')}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: theme.textMuted,
                fontSize: fs(16),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.7}
          >
            {t(lang, 'onboardBody')}
          </Text>
          <Card style={[styles.safetyCard, { borderColor: theme.warn }]}>
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
              {t(lang, 'onboardSafety')}
            </Text>
          </Card>
          <Button
            label={t(lang, 'getStarted')}
            onPress={() => setStep(1)}
            fullWidth
            style={styles.action}
            icon={(color) => <ArrowRight size={20} color={color} />}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.step}>
          <Text
            style={[styles.title, { color: theme.text, fontSize: fs(28) }]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'chooseProfile')}
          </Text>
          {profileOptions.map((option) => {
            const Icon = option.icon;
            const selected = prefs.profile === option.value;
            return (
              <Card
                key={option.value}
                onPress={() => {
                  updatePrefs({ profile: option.value });
                  setStep(2);
                }}
                accessibilityLabel={option.title}
                style={[
                  styles.profileCard,
                  { borderColor: selected ? theme.accent : theme.border },
                ]}
              >
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                    <Icon size={24} color={theme.accent} />
                  </View>
                  <View style={styles.flex}>
                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: theme.text,
                          fontSize: fs(17),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}
                      maxFontSizeMultiplier={1.6}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardBody,
                        {
                          color: theme.textMuted,
                          fontSize: fs(13),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}
                      maxFontSizeMultiplier={1.6}
                    >
                      {option.body}
                    </Text>
                  </View>
                  <ArrowRight size={20} color={theme.textMuted} />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.step}>
          <Text
            style={[styles.title, { color: theme.text, fontSize: fs(28) }]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'chooseLanguage')}
          </Text>
          <SegmentedControl<Lang>
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
            value={prefs.lang}
            onChange={(value) => updatePrefs({ lang: value })}
            label={t(lang, 'language')}
          />

          <Text
            style={[styles.title, { color: theme.text, fontSize: fs(24), marginTop: space.xl }]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'chooseTheme')}
          </Text>
          <SegmentedControl<ThemeMode>
            options={[
              { value: 'auto', label: t(lang, 'auto') },
              { value: 'night', label: t(lang, 'night') },
              { value: 'daylight', label: t(lang, 'daylight') },
            ]}
            value={prefs.themeMode}
            onChange={(value) => updatePrefs({ themeMode: value })}
            label={t(lang, 'theme')}
          />

          <Button
            label={t(lang, 'continue')}
            onPress={() => setStep(3)}
            fullWidth
            style={styles.action}
            icon={(color) => <ArrowRight size={20} color={color} />}
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.step}>
          <Text
            style={[styles.title, { color: theme.text, fontSize: fs(28) }]}
            maxFontSizeMultiplier={1.8}
          >
            {t(lang, 'testSetup')}
          </Text>
          <Card style={styles.sampleCard}>
            <Text
              style={[
                styles.sample,
                {
                  color: theme.text,
                  fontSize: fs(20),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
              maxFontSizeMultiplier={1.7}
            >
              {sample}
            </Text>
            <Text
              style={[
                styles.cardBody,
                {
                  color: theme.textMuted,
                  fontSize: fs(13),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              maxFontSizeMultiplier={1.6}
            >
              {t(lang, 'safetyText')}
            </Text>
          </Card>
          <View style={[styles.testRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Button
              label={t(lang, 'testVoice')}
              variant="secondary"
              onPress={() => speakText(sample, lang, prefs.voiceRate, false)}
              icon={(color) => <Volume2 size={18} color={color} />}
              style={styles.flex}
            />
            <Button
              label={t(lang, 'testHaptics')}
              variant="secondary"
              onPress={() => playHaptic('right', prefs.haptics)}
              icon={(color) => <Vibrate size={18} color={color} />}
              style={styles.flex}
            />
          </View>
          <Button
            label={t(lang, 'startExploring')}
            onPress={finish}
            fullWidth
            style={styles.action}
            icon={(color) => <ArrowRight size={20} color={color} />}
          />
        </View>
      ) : null}

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
  brand: { alignItems: 'center', gap: space.xs },
  brandText: { fontFamily: fontFamily.bold },
  skip: { fontFamily: fontFamily.medium, textDecorationLine: 'underline' },
  dots: { flexDirection: 'row', gap: 6, marginTop: space.lg },
  dot: { height: 8, borderRadius: 4 },
  hero: { marginTop: space.xxl, gap: space.md },
  step: { marginTop: space.xxl, gap: space.md },
  title: { fontFamily: fontFamily.bold, letterSpacing: 0, lineHeight: 38 },
  body: { fontFamily: fontFamily.regular, lineHeight: 24 },
  safetyCard: { borderWidth: 1 },
  safety: { fontFamily: fontFamily.regular, lineHeight: 21 },
  action: { marginTop: space.md },
  profileCard: { padding: space.md },
  row: { alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: fontFamily.semibold },
  cardBody: { fontFamily: fontFamily.regular, marginTop: 2, lineHeight: 19 },
  sampleCard: { gap: space.sm },
  sample: { fontFamily: fontFamily.semibold, lineHeight: 29 },
  testRow: { gap: space.sm },
  bottomSpacer: { height: space.huge },
});
