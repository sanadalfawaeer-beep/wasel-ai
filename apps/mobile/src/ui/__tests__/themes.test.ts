import { describe, expect, it } from 'vitest';
import { themes } from '../themes';

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((index) => {
    const channel = parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe('themes', () => {
  it('ships exactly the three accessible themes', () => {
    expect(Object.keys(themes).sort()).toEqual(['contrast', 'daylight', 'night']);
  });

  it.each(Object.entries(themes))('%s keeps body and control contrast', (_name, theme) => {
    expect(contrast(theme.text, theme.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.text, theme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.textMuted, theme.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.accentInk, theme.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.accent, theme.bg)).toBeGreaterThanOrEqual(3);
  });
});
