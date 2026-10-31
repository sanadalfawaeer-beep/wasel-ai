import { Mic, Send, Trash2, Volume2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { speakText } from '@/lib/speech';
import { t } from '@/lib/translate';
import { listenOnce, type VoiceHandle } from '@/lib/voice';
import { useApp } from '@/state/AppProvider';
import { Card } from '@/ui/components/Card';
import { Header } from '@/ui/components/Header';
import { IconButton } from '@/ui/components/IconButton';
import { LiveCaptions, type Caption } from '@/ui/components/LiveCaptions';
import { Screen } from '@/ui/components/Screen';
import { TabBar } from '@/ui/components/TabBar';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

const QUICK_PHRASES: Record<'en' | 'ar', string[]> = {
  en: [
    "Hello, I'm Deaf. Please type or speak slowly.",
    'Where is the elevator?',
    'Can you write it down?',
    'Thank you.',
  ],
  ar: [
    'مرحبًا، أنا أصم. من فضلك اكتب أو تحدث ببطء.',
    'أين المصعد؟',
    'هل يمكنك كتابتها؟',
    'شكرًا.',
  ],
};

const DEMO_REPLY: Record<'en' | 'ar', string> = {
  en: 'The elevator is to your right, past the main desk.',
  ar: 'المصعد على يمينك، بعد مكتب الاستقبال.',
};

export default function ConverseScreen() {
  const { prefs } = useApp();
  const { theme, isRTL, fs } = useTheme();
  const lang = prefs.lang;
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const voiceRef = useRef<VoiceHandle | null>(null);

  const addCaption = (speaker: 'you' | 'them', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCaptions((current) => [
      ...current,
      { id: `${Date.now()}-${current.length}`, speaker, text: trimmed },
    ]);
  };

  const speakAndAdd = (text: string) => {
    addCaption('you', text);
    speakText(text, lang, prefs.voiceRate, false);
  };

  const send = () => {
    if (!input.trim()) return;
    speakAndAdd(input);
    setInput('');
  };

  const toggleListening = async () => {
    if (listening) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setListening(false);
      return;
    }
    setNote(null);
    setListening(true);
    voiceRef.current = await listenOnce(
      lang,
      (text) => {
        addCaption('them', text);
        setListening(false);
        voiceRef.current?.stop();
        voiceRef.current = null;
      },
      (reason) => {
        setListening(false);
        voiceRef.current = null;
        setNote(reason === 'unavailable' ? t(lang, 'micUnavailable') : reason);
      },
      () => setListening(false),
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Screen scroll={false} padded keyboard edges={['top', 'left', 'right']}>
        <Header
          lang={lang}
          title={t(lang, 'converse')}
          subtitle={t(lang, 'tagline')}
          right={
            <IconButton
              label={t(lang, 'clear')}
              onPress={() => setCaptions([])}
              icon={(color) => <Trash2 size={20} color={color} />}
            />
          }
        />

        <Card style={styles.captionCard} padding={space.md}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text
              style={[styles.cardTitle, { color: theme.textMuted, fontSize: fs(12) }]}
              maxFontSizeMultiplier={1.5}
            >
              {t(lang, 'them')}
            </Text>
            <View style={[styles.livePill, { backgroundColor: theme.accentSoft }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.liveText, { color: theme.accentText, fontSize: fs(11) }]}>
                LIVE
              </Text>
            </View>
          </View>
          <LiveCaptions captions={captions} lang={lang} />
        </Card>

        <Text
          style={[
            styles.sectionLabel,
            {
              color: theme.textMuted,
              fontSize: fs(12),
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          maxFontSizeMultiplier={1.5}
        >
          {t(lang, 'quickPhrases')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.phraseScroll}
          contentContainerStyle={[styles.phraseRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {QUICK_PHRASES[lang].map((phrase) => (
            <Pressable
              key={phrase}
              onPress={() => speakAndAdd(phrase)}
              accessibilityRole="button"
              accessibilityLabel={phrase}
              style={({ pressed }) => [
                styles.phrase,
                {
                  backgroundColor: theme.surfaceRaised,
                  borderColor: theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Volume2 size={14} color={theme.accent} />
              <Text
                numberOfLines={2}
                style={[
                  styles.phraseText,
                  {
                    color: theme.text,
                    fontSize: fs(14),
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                maxFontSizeMultiplier={1.5}
              >
                {phrase}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => addCaption('them', DEMO_REPLY[lang])}
          accessibilityRole="button"
          style={[
            styles.demoLink,
            { alignSelf: isRTL ? 'flex-end' : 'flex-start' },
          ]}
        >
          <Text style={[styles.demoText, { color: theme.textMuted, fontSize: fs(12) }]}>
            {t(lang, 'demoReply')}
          </Text>
        </Pressable>

        <View style={[styles.inputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <IconButton
            label={listening ? t(lang, 'stop') : t(lang, 'listeningForReply')}
            variant={listening ? 'accent' : 'surface'}
            onPress={() => void toggleListening()}
            icon={(color) =>
              listening ? (
                <ActivityIndicator size="small" color={color} />
              ) : (
                <Mic size={22} color={color} />
              )
            }
          />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            placeholder={t(lang, 'typeMessage')}
            placeholderTextColor={theme.textMuted}
            returnKeyType="send"
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
                fontSize: fs(16),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          />
          <IconButton
            label={t(lang, 'send')}
            variant="accent"
            onPress={send}
            icon={(color) => <Send size={20} color={color} />}
          />
        </View>
        {note ? (
          <Text
            style={[
              styles.note,
              {
                color: theme.warn,
                fontSize: fs(12),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {note}
          </Text>
        ) : (
          <Text
            style={[
              styles.note,
              {
                color: theme.textMuted,
                fontSize: fs(12),
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            maxFontSizeMultiplier={1.5}
          >
            {t(lang, 'listeningForReply')}
          </Text>
        )}

        <View style={styles.bottomSpacer} />
      </Screen>
      <TabBar active="converse" lang={lang} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  captionCard: { flex: 1, marginBottom: space.sm },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  cardTitle: { fontFamily: fontFamily.semibold },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontFamily: fontFamily.bold, letterSpacing: 0.5 },
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    marginTop: space.xs,
    marginBottom: space.xs,
  },
  phraseScroll: { flexGrow: 0, flexShrink: 0, maxHeight: 74 },
  phraseRow: { gap: space.xs, paddingBottom: space.xs, alignItems: 'center' },
  phrase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    maxWidth: 300,
    flexShrink: 0,
  },
  phraseText: { fontFamily: fontFamily.medium, flexShrink: 1, lineHeight: 18 },
  demoLink: { paddingVertical: 4 },
  demoText: { fontFamily: fontFamily.medium, textDecorationLine: 'underline' },
  inputRow: { alignItems: 'center', gap: space.xs, marginTop: space.xs },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontFamily: fontFamily.regular,
  },
  note: { fontFamily: fontFamily.regular, marginTop: space.xs, lineHeight: 17 },
  bottomSpacer: { height: 104 },
});
