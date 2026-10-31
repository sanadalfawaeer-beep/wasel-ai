import { useRouter } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  Bus,
  DoorOpen,
  Globe,
  Mic,
  Settings as SettingsIcon,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatDistance, t } from '@/lib/translate';
import { listenOnce, type VoiceHandle } from '@/lib/voice';
import { useApp } from '@/state/AppProvider';
import type { Lang, Profile } from '@/types';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Header } from '@/ui/components/Header';
import { IconButton } from '@/ui/components/IconButton';
import { Screen } from '@/ui/components/Screen';
import { SegmentedControl } from '@/ui/components/SegmentedControl';
import { TabBar } from '@/ui/components/TabBar';
import { layout, radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

const QUICK_PLACES = [
  { key: 'library', icon: BookOpen, distance: 300 },
  { key: 'mainGate', icon: DoorOpen, distance: 480 },
  { key: 'studentCenter', icon: Users, distance: 620 },
  { key: 'pharmacy', icon: Stethoscope, distance: 750 },
] as const;

function SectionTitle({ children }: { children: string }) {
  const { theme, fs } = useTheme();
  return (
    <Text
      style={[
        styles.sectionTitle,
        { color: theme.textMuted, fontSize: fs(13) },
      ]}
      maxFontSizeMultiplier={1.5}
    >
      {children}
    </Text>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { prefs, route, updatePrefs } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const voiceRef = useRef<VoiceHandle | null>(null);

  const profileOptions: Array<{ value: Profile; label: string }> = [
    { value: 'blind', label: t(lang, 'voiceGuide') },
    { value: 'deaf', label: t(lang, 'visualGuide') },
    { value: 'deafblind', label: t(lang, 'bothProfiles') },
  ];

  const defaultDestination = lang === 'ar' ? 'خذني إلى المكتبة' : 'Take me to the library';
  const align = { textAlign: (isRTL ? 'right' : 'left') as 'right' | 'left' };

  const openPlan = (text: string, name?: string) => {
    router.push({
      pathname: '/plan',
      params: { text: text.trim() || defaultDestination, name: name ?? '' },
    });
  };

  const startVoice = async () => {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      return;
    }

    setVoiceNote(null);
    setListening(true);
    voiceRef.current = await listenOnce(
      lang,
      (text) => {
        setQuery(text);
        setListening(false);
        voiceRef.current?.stop();
        voiceRef.current = null;
      },
      (reason) => {
        setListening(false);
        voiceRef.current = null;
        if (reason === 'unavailable') {
          setVoiceNote(t(lang, 'voiceNeedsBuild'));
          inputRef.current?.focus();
        } else {
          setVoiceNote(reason);
        }
      },
      () => setListening(false),
    );
  };

  const toggleLanguage = () => {
    updatePrefs({ lang: (lang === 'en' ? 'ar' : 'en') as Lang });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Screen scroll padded={false} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.gutter}>
            <Header
              lang={lang}
              brand
              right={
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Pressable
                    onPress={toggleLanguage}
                    accessibilityRole="button"
                    accessibilityLabel={t(lang, 'language')}
                    style={({ pressed }) => [
                      styles.langPill,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.surfaceRaised,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Globe size={15} color={theme.textMuted} />
                    <Text
                      style={[
                        styles.langText,
                        { color: theme.text, fontSize: fs(13) },
                      ]}
                    >
                      {lang === 'en' ? 'العربية' : 'English'}
                    </Text>
                  </Pressable>
                  <IconButton
                    label={t(lang, 'settings')}
                    onPress={() => router.push('/settings')}
                    icon={(color) => <SettingsIcon size={22} color={color} />}
                  />
                </View>
              }
            />

            <Text
              maxFontSizeMultiplier={2}
              style={[
                styles.hero,
                {
                  color: theme.text,
                  fontSize: fs(36),
                  lineHeight: fs(36) * 1.12,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {t(lang, 'whereTo')}
            </Text>
            <Text
              maxFontSizeMultiplier={1.7}
              style={[
                styles.subtitle,
                {
                  color: theme.textMuted,
                  fontSize: fs(15),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {t(lang, 'homeSubtitle')}
            </Text>

            <View style={styles.profileWrap}>
              <SegmentedControl<Profile>
                options={profileOptions}
                value={prefs.profile}
                onChange={(profile) => updatePrefs({ profile })}
                label={t(lang, 'profile')}
              />
            </View>

            <Card style={styles.micCard}>
              <Pressable
                onPress={() => void startVoice()}
                accessibilityRole="button"
                accessibilityLabel={listening ? t(lang, 'listening') : t(lang, 'holdToSpeak')}
                accessibilityState={{ busy: listening }}
                style={({ pressed }) => [
                  styles.micOrb,
                  {
                    backgroundColor: listening ? theme.accentSoft : theme.accent,
                    borderColor: theme.accent,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                {listening ? (
                  <ActivityIndicator size="large" color={theme.accent} />
                ) : (
                  <Mic size={38} color={theme.accentInk} strokeWidth={2.2} />
                )}
              </Pressable>
              <Text
                style={[
                  styles.micLabel,
                  { color: listening ? theme.accent : theme.text, fontSize: fs(17) },
                ]}
                maxFontSizeMultiplier={1.6}
              >
                {listening ? t(lang, 'listening') : t(lang, 'holdToSpeak')}
              </Text>

              <View style={[styles.inputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => openPlan(query)}
                  placeholder={t(lang, 'destinationPlaceholder')}
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="go"
                  accessibilityLabel={t(lang, 'typeDestination')}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                      color: theme.text,
                      fontSize: fs(16),
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                  maxFontSizeMultiplier={1.5}
                />
                <IconButton
                  label={t(lang, 'go')}
                  variant="accent"
                  onPress={() => openPlan(query)}
                  icon={(color) => <ArrowRight size={22} color={color} />}
                />
              </View>
              {voiceNote ? (
                <Text
                  style={[
                    styles.voiceNote,
                    {
                      color: theme.warn,
                      fontSize: fs(12),
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                  maxFontSizeMultiplier={1.5}
                >
                  {voiceNote}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.voiceNote,
                    {
                      color: theme.textMuted,
                      fontSize: fs(12),
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                  maxFontSizeMultiplier={1.5}
                >
                  {t(lang, 'orType')}
                </Text>
              )}
            </Card>

            {!prefs.onboarded ? (
              <Card
                onPress={() => router.push('/onboarding')}
                accessibilityLabel={t(lang, 'setupCardTitle')}
                style={[styles.setupCard, { borderColor: theme.accent }]}
              >
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                    <Sparkles size={22} color={theme.accent} />
                  </View>
                  <View style={styles.flex}>
                    <Text
                      style={[
                        styles.setupTitle,
                        { color: theme.text, fontSize: fs(16) },
                        align,
                      ]}
                      maxFontSizeMultiplier={1.6}
                    >
                      {t(lang, 'setupCardTitle')}
                    </Text>
                    <Text
                      style={[
                        styles.setupBody,
                        { color: theme.textMuted, fontSize: fs(13) },
                        align,
                      ]}
                      maxFontSizeMultiplier={1.6}
                    >
                      {t(lang, 'setupCardBody')}
                    </Text>
                  </View>
                  <ArrowRight size={20} color={theme.accent} />
                </View>
              </Card>
            ) : null}

            {route ? (
              <View style={styles.section}>
                <SectionTitle>{t(lang, 'recentRoute')}</SectionTitle>
                <Card
                  onPress={() => router.push('/guide')}
                  accessibilityLabel={`${t(lang, 'resume')} ${route.destination.name}`}
                  style={styles.recentCard}
                >
                  <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                      <ArrowRight size={22} color={theme.accent} />
                    </View>
                    <View style={styles.flex}>
                      <Text
                        style={[
                          styles.placeName,
                          { color: theme.text, fontSize: fs(16) },
                          align,
                        ]}
                        maxFontSizeMultiplier={1.6}
                      >
                        {route.destination.name}
                      </Text>
                      <Text
                        style={[
                          styles.placeMeta,
                          { color: theme.textMuted, fontSize: fs(13) },
                          align,
                        ]}
                        maxFontSizeMultiplier={1.6}
                      >
                        {formatDistance(route.distance_m, lang)} · {t(lang, 'resume')}
                      </Text>
                    </View>
                    <ArrowRight size={20} color={theme.textMuted} />
                  </View>
                </Card>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionTitle>{t(lang, 'quickPlaces')}</SectionTitle>
              <View style={styles.grid}>
                {QUICK_PLACES.map((place) => {
                  const Icon = place.icon;
                  const label = t(lang, place.key);
                  return (
                    <Card
                      key={place.key}
                      onPress={() =>
                        openPlan(
                          lang === 'ar' ? `خذني إلى ${label}` : `Take me to the ${label}`,
                          label,
                        )
                      }
                      accessibilityLabel={`${label}, ${formatDistance(place.distance, lang)}`}
                      style={styles.placeCard}
                      padding={space.md}
                    >
                      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                          <Icon size={20} color={theme.accent} />
                        </View>
                        <View style={styles.flex}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.placeName,
                              { color: theme.text, fontSize: fs(15) },
                              align,
                            ]}
                            maxFontSizeMultiplier={1.6}
                          >
                            {label}
                          </Text>
                          <Text
                            style={[
                              styles.placeMeta,
                              { color: theme.textMuted, fontSize: fs(12) },
                              align,
                            ]}
                            maxFontSizeMultiplier={1.6}
                          >
                            {formatDistance(place.distance, lang)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>

            <Card
              onPress={() => router.push('/bus')}
              accessibilityLabel={t(lang, 'busPlanner')}
              style={styles.busCard}
            >
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconBubble, { backgroundColor: theme.accentSoft }]}>
                  <Bus size={22} color={theme.accent} />
                </View>
                <View style={styles.flex}>
                  <Text
                    style={[styles.setupTitle, { color: theme.text, fontSize: fs(16) }, align]}
                    maxFontSizeMultiplier={1.6}
                  >
                    {t(lang, 'bus')}
                  </Text>
                  <Text
                    style={[styles.setupBody, { color: theme.textMuted, fontSize: fs(13) }, align]}
                    maxFontSizeMultiplier={1.6}
                  >
                    {t(lang, 'busCardBody')}
                  </Text>
                </View>
                <ArrowRight size={20} color={theme.textMuted} />
              </View>
            </Card>

            <Button
              label={t(lang, 'converse')}
              variant="secondary"
              fullWidth
              onPress={() => router.push('/converse')}
              icon={(color) => <Globe size={20} color={color} />}
              style={styles.converseButton}
            />
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>
      </Screen>
      <TabBar active="home" lang={lang} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 120 },
  gutter: { paddingHorizontal: layout.gutter },
  headerActions: { alignItems: 'center', gap: space.xs },
  langPill: {
    height: 40,
    minWidth: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  langText: { fontFamily: fontFamily.medium },
  hero: {
    fontFamily: fontFamily.bold,
    marginTop: space.lg,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    marginTop: space.xs,
    lineHeight: 22,
  },
  profileWrap: { marginTop: space.lg, marginBottom: space.md },
  micCard: { alignItems: 'center', gap: space.sm },
  micOrb: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micLabel: { fontFamily: fontFamily.semibold },
  inputRow: { width: '100%', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fontFamily.regular,
  },
  voiceNote: {
    fontFamily: fontFamily.regular,
    alignSelf: 'stretch',
    lineHeight: 17,
  },
  section: { marginTop: space.xl },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    marginBottom: space.xs,
  },
  setupCard: { marginTop: space.md },
  row: { alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: { fontFamily: fontFamily.semibold },
  setupBody: { fontFamily: fontFamily.regular, marginTop: 2, lineHeight: 18 },
  recentCard: { marginTop: space.xs },
  placeName: { fontFamily: fontFamily.semibold },
  placeMeta: { fontFamily: fontFamily.regular, marginTop: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.xs,
  },
  placeCard: { width: '47.5%' },
  busCard: { marginTop: space.xl },
  converseButton: { marginTop: space.md },
  bottomSpacer: { height: space.xxl },
});
