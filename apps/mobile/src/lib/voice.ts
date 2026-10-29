import type { Lang } from '@/types';

export interface VoiceHandle {
  stop: () => void;
}

/**
 * Lazy-load speech recognition so Expo Go (where the native module is absent)
 * can still run the whole app. The failure is caught and surfaced as
 * "unavailable" instead of crashing at import time.
 */
export async function listenOnce(
  lang: Lang,
  onResult: (text: string) => void,
  onError: (reason: string) => void,
  onEnd?: () => void,
): Promise<VoiceHandle> {
  try {
    const module = await import('expo-speech-recognition');
    const recognition = module.ExpoSpeechRecognitionModule;
    if (!recognition) {
      onError('unavailable');
      return { stop: () => undefined };
    }

    let stopped = false;
    const subscriptions: Array<{ remove: () => void }> = [];
    const cleanup = () => {
      for (const subscription of subscriptions) {
        try {
          subscription.remove();
        } catch {
          // Native module already torn down.
        }
      }
      subscriptions.length = 0;
    };

    subscriptions.push(
      recognition.addListener('result', (event: { results?: Array<{ transcript?: string }> }) => {
        const transcript = event.results?.[0]?.transcript;
        if (transcript) onResult(transcript);
      }),
    );
    subscriptions.push(
      recognition.addListener('error', (event: { message?: string }) => {
        if (!stopped) onError(event.message ?? 'Speech recognition error');
      }),
    );
    subscriptions.push(
      recognition.addListener('end', () => {
        if (!stopped) onEnd?.();
      }),
    );

    recognition.start({
      lang: lang === 'ar' ? 'ar-JO' : 'en-US',
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: false,
    });

    return {
      stop: () => {
        stopped = true;
        try {
          recognition.stop();
        } catch {
          // Ignore.
        }
        cleanup();
      },
    };
  } catch {
    onError('unavailable');
    return { stop: () => undefined };
  }
}
