import raw from './themes.json';

export type ThemeName = 'night' | 'daylight' | 'contrast';

export interface Theme {
  name: string;
  mode: 'dark' | 'light';
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  warn: string;
  warnInk: string;
  warnSoft: string;
  danger: string;
  dangerInk: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
  shadow: string;
}

export const themes = raw as Record<ThemeName, Theme>;
export const themeNames = Object.keys(themes) as ThemeName[];
