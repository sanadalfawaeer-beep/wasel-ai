# Wasel mobile

Expo SDK 58 + React Native + TypeScript.

```powershell
npm install
npx expo start
```

- Expo Go: full UI, TTS, haptics, location, demo route.
- Voice input: development build only (`npx expo run:android` or EAS). Expo Go falls back to the text field.
- API host: derived from Expo's dev server. Override with `EXPO_PUBLIC_API_URL` in `.env` if needed.
- Design system: `src/ui/themes.json`, `src/ui/tokens.ts`, `docs/design/ui-spec.md`.
- Typecheck: `npx tsc --noEmit`.
- Logic tests: `npm test` (Vitest: geo, cue engine, theme contrast).
- Contrast gate: `node ../../scripts/check-contrast.mjs`.
