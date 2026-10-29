import { describe, expect, it } from 'vitest';
import type { Cue, CueKind, RoutePlan } from '@/types';
import { cueToFire, nextCue, toneFor } from '../cueEngine';

function cue(
  id: string,
  kind: CueKind,
  lat: number,
  lng: number,
  trigger: number,
): Cue {
  return {
    id,
    kind,
    say: `${kind} ${id}`,
    detail: `${kind} ${id}`,
    short: kind,
    at: { lat, lng },
    trigger_m: trigger,
    haptic: kind === 'TURN_LEFT' ? 'left' : kind === 'TURN_RIGHT' ? 'right' : 'tick',
    urgency: 'normal',
  };
}

const start = { lat: 0, lng: 0 };
const route: RoutePlan = {
  route_id: 'test',
  destination: { name: 'Test', address: '', lat: 0.001, lng: 0.001 },
  polyline: '',
  points: [start, { lat: 0, lng: 0.001 }, { lat: 0.001, lng: 0.001 }],
  distance_m: 220,
  duration_s: 180,
  cues: [
    cue('cue_1', 'DEPART', 0, 0, 0),
    cue('cue_2', 'TURN_RIGHT', 0, 0.001, 30),
    cue('cue_3', 'ARRIVE', 0.001, 0.001, 12),
  ],
  provider: 'test',
  language: 'en',
};

describe('cue engine', () => {
  it('fires the departure cue at the start', () => {
    expect(cueToFire(route, start, new Set())?.id).toBe('cue_1');
  });

  it('does not fire a cue twice', () => {
    expect(cueToFire(route, start, new Set(['cue_1']))).toBeNull();
  });

  it('returns the next cue for the preview', () => {
    expect(nextCue(route, 'cue_1')?.id).toBe('cue_2');
    expect(nextCue(route, 'cue_3')).toBeNull();
  });

  it('keeps departures and arrivals calm', () => {
    expect(toneFor(route.cues[0], 0)).toBe('normal');
    expect(toneFor(route.cues[2], 0)).toBe('normal');
  });

  it('raises a turn to imminent inside 10 metres', () => {
    expect(toneFor(route.cues[1], 9)).toBe('imminent');
    expect(toneFor(route.cues[1], 30)).toBe('normal');
  });
});
