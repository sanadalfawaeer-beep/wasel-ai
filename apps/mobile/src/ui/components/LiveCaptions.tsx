import { useEffect, useRef, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '@/lib/translate';
import type { Lang } from '@/types';
import { radius, space } from '@/ui/tokens';
import { fontFamily } from '@/ui/typography';
import { useTheme } from '@/ui/useTheme';

export interface Caption {
  id: string;
  speaker: 'you' | 'them';
  text: string;
}

interface LiveCaptionsProps {
  captions: Caption[];
  lang: Lang;
}

export function LiveCaptions({ captions, lang }: LiveCaptionsProps) {
  const { theme, isRTL, fs } = useTheme();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const timeout = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [captions.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {captions.length === 0 ? (
        <Text
          style={[styles.empty, { color: theme.textMuted, fontSize: fs(16) }]}
          maxFontSizeMultiplier={1.8}
        >
          {t(lang, 'listeningForReply')}
        </Text>
      ) : null}
      {captions.map((caption, index) => {
        const mine = caption.speaker === 'you';
        const latest = index === captions.length - 1;
        return (
          <View
            key={caption.id}
            style={[
              styles.bubble,
              {
                alignSelf: mine
                  ? isRTL
                    ? 'flex-start'
                    : 'flex-end'
                  : isRTL
                    ? 'flex-end'
                    : 'flex-start',
                backgroundColor: mine ? theme.accentSoft : theme.surfaceRaised,
                borderColor: mine ? theme.accent : theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.speaker,
                {
                  color: mine ? theme.accentText : theme.textMuted,
                  fontSize: fs(12),
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {mine ? t(lang, 'you') : t(lang, 'them')}
            </Text>
            <Text
              accessibilityLiveRegion={latest ? 'polite' : 'none'}
              maxFontSizeMultiplier={1.8}
              style={[
                styles.text,
                {
                  color: theme.text,
                  fontSize: fs(20),
                  lineHeight: fs(20) * 1.45,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}
            >
              {caption.text}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: space.sm, paddingVertical: space.sm },
  empty: {
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: space.xl,
    opacity: 0.8,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: 2,
  },
  speaker: { fontFamily: fontFamily.semibold },
  text: { fontFamily: fontFamily.regular },
});
