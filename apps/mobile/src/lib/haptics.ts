import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';
import type { HapticPattern } from '@/types';

const ANDROID_PATTERNS: Record<HapticPattern, number[]> = {
  left: [0, 70],
  right: [0, 70, 80, 70],
  arrive: [0, 90, 70, 90, 70, 180],
  warn: [0, 320, 120, 320],
  tick: [0, 35],
};

export const HAPTIC_DESCRIPTION: Record<HapticPattern, { en: string; ar: string }> = {
  left: { en: 'One pulse', ar: 'نبضة واحدة' },
  right: { en: 'Two pulses', ar: 'نبضتان' },
  arrive: { en: 'Three rising pulses', ar: 'ثلاث نبضات صاعدة' },
  warn: { en: 'Two long buzzes', ar: 'اهتزازتان طويلتان' },
  tick: { en: 'A short tick', ar: 'نبضة قصيرة' },
};

export function playHaptic(pattern: HapticPattern, enabled = true): void {
  if (!enabled) return;

  if (Platform.OS === 'android') {
    Vibration.vibrate(ANDROID_PATTERNS[pattern]);
    return;
  }

  // iOS: Core Haptics patterns need a native module in Phase 1. For now,
  // notification/impact haptics still carry the urgency distinction.
  switch (pattern) {
    case 'arrive':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warn':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'tick':
      void Haptics.selectionAsync();
      break;
    default:
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
  }
}

export function stopHaptics(): void {
  Vibration.cancel();
}
