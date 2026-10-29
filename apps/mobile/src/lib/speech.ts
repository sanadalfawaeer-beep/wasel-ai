import { AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';
import type { Cue, Lang, VoiceRate } from '@/types';

function languageTag(lang: Lang): string {
  return lang === 'ar' ? 'ar-JO' : 'en-US';
}

export function speakCue(
  cue: Cue,
  lang: Lang,
  rate: VoiceRate,
  screenReader: boolean,
): void {
  if (screenReader) {
    AccessibilityInfo.announceForAccessibility(cue.say);
    return;
  }
  Speech.stop();
  Speech.speak(cue.say, {
    language: languageTag(lang),
    rate,
    pitch: 1,
  });
}

export function speakText(
  text: string,
  lang: Lang,
  rate: VoiceRate,
  screenReader = false,
): void {
  if (screenReader) {
    AccessibilityInfo.announceForAccessibility(text);
    return;
  }
  Speech.stop();
  Speech.speak(text, {
    language: languageTag(lang),
    rate,
    pitch: 1,
  });
}

export function stopSpeech(): void {
  Speech.stop();
}
