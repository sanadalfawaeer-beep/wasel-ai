import { describe, expect, it } from 'vitest';
import type { RoutePlan } from '@/types';
import { haversineM, pathLengthM, pointAtDistance, progressOnRoute } from '../geo';

const points = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 0.001 },
  { lat: 0.001, lng: 0.001 },
];

const route = {
  route_id: 'test',
  destination: { name: 'Test', address: '', lat: 0, lng: 0 },
  polyline: '',
  points,
  distance_m: 222,
  duration_s: 180,
  cues: [],
  provider: 'test',
  language: 'en',
} satisfies RoutePlan;

describe('geo', () => {
  it('measures a degree of longitude near the equator', () => {
    expect(haversineM(points[0], points[1])).toBeGreaterThan(111);
    expect(haversineM(points[0], points[1])).toBeLessThan(112);
  });

  it('measures path length', () => {
    expect(pathLengthM(points)).toBeGreaterThan(222);
    expect(pathLengthM(points)).toBeLessThan(223);
  });

  it('interpolates to the segment endpoint', () => {
    const midpoint = pointAtDistance(points, pathLengthM(points) / 2);
    expect(midpoint.lat).toBeCloseTo(0, 2);
    expect(midpoint.lng).toBeCloseTo(0.001, 5);
  });

  it('projects a position onto the route', () => {
    expect(progressOnRoute(route, points[0])).toBeCloseTo(0, 3);
    expect(progressOnRoute(route, points[points.length - 1])).toBeCloseTo(1, 3);
    expect(progressOnRoute(route, { lat: 0, lng: 0.0005 })).toBeGreaterThan(0);
    expect(progressOnRoute(route, { lat: 0, lng: 0.0005 })).toBeLessThan(0.5);
  });
});
