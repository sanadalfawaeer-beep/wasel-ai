import type { Cue, LatLng, RoutePlan } from '@/types';
import { haversineM } from './geo';

/**
 * Cues fire once, when the user enters the trigger radius. The departure cue
 * has a zero radius by design, so it gets a small practical buffer for GPS.
 */
export function cueToFire(
  route: RoutePlan,
  position: LatLng,
  fired: ReadonlySet<string>,
): Cue | null {
  for (const cue of route.cues) {
    if (fired.has(cue.id)) continue;
    const distance = haversineM(position, cue.at);
    const radius = cue.trigger_m === 0 ? 8 : cue.trigger_m;
    if (distance <= radius) return cue;
  }
  return null;
}

export function distanceToCue(cue: Cue, position: LatLng): number {
  return haversineM(position, cue.at);
}

export function nextCue(route: RoutePlan, activeCueId: string | null): Cue | null {
  if (!activeCueId) return route.cues[0] ?? null;
  const index = route.cues.findIndex((cue) => cue.id === activeCueId);
  if (index < 0) return null;
  return route.cues[index + 1] ?? null;
}

export function toneFor(cue: Cue | null, distanceM: number): 'normal' | 'imminent' | 'critical' {
  if (!cue) return 'normal';
  if (cue.urgency === 'critical') return 'critical';
  if (cue.kind === 'WARN') return 'critical';
  if (cue.kind === 'DEPART' || cue.kind === 'ARRIVE') return 'normal';
  if (distanceM <= 10) return 'imminent';
  if (cue.urgency === 'imminent') return 'imminent';
  return 'normal';
}
