# Accessibility testing plan

## Gates before a pilot

| Gate | Method | Pass |
|---|---|---|
| Contrast | `node scripts/check-contrast.mjs` | All pairs pass |
| Text scale | 100/125/150/200% on a 320px screen | No clipping; primary action still reachable |
| Screen reader | TalkBack (Android) + VoiceOver (iOS) on Home, Plan, Guide, Settings | Every control named; cue announced once; no double speech |
| RTL | Switch to العربية, restart-free layout | Layout mirrors; arrows do not |
| Reduce motion | OS setting + app preference | Cue appears instantly; no looping animation |
| Reduce transparency | OS setting | Dock is opaque and readable |
| Sunlight | Take the phone outside at midday | Daylight instruction stage readable at arm's length |
| Haptics | Deaf tester, sound off | Route completable from haptics + visuals |
| Audio | Blind tester, screen ignored | Route completable from speech + haptics |
| Safety | O&M specialist reviews cue phrasing | No "cross now"; no cue that overrides judgment |

## The screen-reader/TTS conflict

If TalkBack or VoiceOver is on and `expo-speech` also speaks, the user hears two voices. The app detects the screen reader and uses `AccessibilityInfo.announceForAccessibility` instead. Test both paths:

1. Screen reader off → expo-speech speaks the cue.
2. Screen reader on → the screen reader announces the cue; the app is silent.

Do not put `accessibilityLiveRegion` on the distance countdown. Announce the instruction text only.

## Physical test protocol

- Two routes per tester, one familiar and one unfamiliar.
- A trained researcher or O&M specialist walks with every blind participant.
- Controlled crossings only. Stop the test at the first unsafe cue.
- Record: route completed without help, wrong turns, missed cues, stops, time, and any moment the tester hesitated.
- Debrief with three questions: what did the app say that helped, what confused you, what would you never trust it to do?
- Compensate testers when the budget allows. For the self-funded Phase 0, recruit a small volunteer group through the UJ disability network, keep sessions short, and state the limitation in the report. Ten people is a directional gate, not a study. External paid testing belongs in the Phase 1 pilot budget.

## Phase 0 gate

- 8/10 testers complete two unfamiliar routes without human help.
- Wrong or missed cues under 5%.
- 9/10 arrivals.
- Zero safety incidents.
- Arabic and English both pass.
- A Deaf tester completes a route with sound off.
- A blind tester completes a route with the screen ignored.

## What not to claim

- "Accessible routing" until the accessibility graph exists. Phase 0 promises accessible **presentation** of a Google walking route.
- "Replaces a cane or guide dog." It does not.
- "Works indoors" until indoor positioning is tested.
- "Background guidance" until lock-screen audio/location is built and reviewed.

## Recruiting

University of Jordan disability support office, student groups, and local disability organizations. Recruit in week 1, not week 4. Offer a stipend, a clear time commitment, and the option to stop at any time.
