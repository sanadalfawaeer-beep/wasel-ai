#!/usr/bin/env node
/**
 * WCAG contrast gate for the three Wasel themes.
 * Run: node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themes = JSON.parse(
  readFileSync(join(root, 'apps/mobile/src/ui/themes.json'), 'utf8'),
);

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Not a 6-digit hex colour: ${hex}`);
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs = [
  ['Body text on page', 'text', 'bg', 4.5],
  ['Body text on card', 'text', 'surface', 4.5],
  ['Body text on raised card', 'text', 'surfaceRaised', 4.5],
  ['Muted text on page', 'textMuted', 'bg', 4.5],
  ['Muted text on card', 'textMuted', 'surface', 4.5],
  ['Primary button label', 'accentInk', 'accent', 4.5],
  ['Danger button label', 'dangerInk', 'danger', 4.5],
  ['Warning button label', 'warnInk', 'warn', 4.5],
  ['Accent as UI edge', 'accent', 'bg', 3],
  ['Accent text on page', 'accentText', 'bg', 4.5],
  ['Accent text on card', 'accentText', 'surface', 4.5],
  ['Accent text on raised card', 'accentText', 'surfaceRaised', 4.5],
  ['Warning as UI edge', 'warn', 'bg', 3],
  ['Danger as UI edge', 'danger', 'bg', 3],
  ['Info as UI edge', 'info', 'bg', 3],
  ['Card edge visibility', 'border', 'surface', 1.3],
];

let failures = 0;
console.log('Wasel contrast gate');
console.log('='.repeat(72));

for (const [themeName, theme] of Object.entries(themes)) {
  console.log(`\n${theme.name} (${themeName})`);
  for (const [label, fgKey, bgKey, minimum] of pairs) {
    const value = contrast(theme[fgKey], theme[bgKey]);
    const pass = value >= minimum;
    if (!pass) failures += 1;
    console.log(
      `  ${pass ? 'PASS' : 'FAIL'}  ${value.toFixed(2).padStart(5)}:1  ${label} (${minimum}:1)`,
    );
  }
}

console.log('\n' + '='.repeat(72));
if (failures > 0) {
  console.error(`${failures} contrast pair(s) failed. Fix the token, not the test.`);
  process.exit(1);
}
console.log('All contrast pairs pass.');
