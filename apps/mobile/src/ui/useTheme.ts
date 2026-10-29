import { useApp } from '@/state/AppProvider';
import { themeNames, themes, type Theme, type ThemeName } from './themes';

export function useTheme(): {
  theme: Theme;
  themeName: ThemeName;
  isRTL: boolean;
  fs: (size: number) => number;
  prefs: ReturnType<typeof useApp>['prefs'];
} {
  const { prefs } = useApp();

  let themeName: ThemeName;
  if (prefs.themeMode === 'auto') {
    themeName = prefs.profile === 'deaf' ? 'daylight' : 'night';
  } else {
    themeName = prefs.themeMode;
  }
  if (!themeNames.includes(themeName)) themeName = 'night';

  const isRTL = prefs.lang === 'ar';
  const fs = (size: number) => Math.round(size * prefs.textScale);

  return { theme: themes[themeName], themeName, isRTL, fs, prefs };
}
