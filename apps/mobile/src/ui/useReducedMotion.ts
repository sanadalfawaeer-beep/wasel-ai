import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useApp } from '@/state/AppProvider';

export function useReducedMotion(): boolean {
  const { prefs } = useApp();
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setSystemReduced(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (prefs.motion === 'reduced') return true;
  if (prefs.motion === 'full') return false;
  return systemReduced;
}
