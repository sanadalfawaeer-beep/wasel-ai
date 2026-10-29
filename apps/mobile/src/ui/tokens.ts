export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const type = {
  display: 52,
  title: 30,
  h2: 22,
  body: 17,
  label: 15,
  caption: 13,
  distance: 40,
} as const;

export const motion = {
  cue: 280,
  sheet: 320,
  ease: [0.16, 1, 0.3, 1] as const,
} as const;

export const layout = {
  gutter: 20,
  minTarget: 48,
  primaryTarget: 64,
  dockHeight: 96,
} as const;
