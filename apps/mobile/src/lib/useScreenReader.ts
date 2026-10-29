import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * When a screen reader is active, the app must not speak through expo-speech
 * at the same time. Cues are announced through AccessibilityInfo instead.
 */
export function useScreenReader(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => {
        if (mounted) setEnabled(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
