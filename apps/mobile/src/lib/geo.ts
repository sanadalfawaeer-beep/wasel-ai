import type { LatLng, RoutePlan } from '@/types';

const EARTH_RADIUS_M = 6_371_000;
const DEG = Math.PI / 180;

export function haversineM(a: LatLng, b: LatLng): number {
  const lat1 = a.lat * DEG;
  const lat2 = b.lat * DEG;
  const dLat = (b.lat - a.lat) * DEG;
  const dLng = (b.lng - a.lng) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function pathLengthM(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineM(points[i - 1], points[i]);
  }
  return total;
}

export function pointAtDistance(points: LatLng[], targetM: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1) return points[0];

  let remaining = Math.max(0, targetM);
  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const segment = haversineM(start, end);
    if (remaining <= segment || i === points.length - 1) {
      const t = segment === 0 ? 0 : Math.min(1, remaining / segment);
      return {
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t,
      };
    }
    remaining -= segment;
  }
  return points[points.length - 1];
}

/**
 * Project the current position onto the route and return progress in [0, 1].
 * A local equirectangular projection is accurate enough at campus scale.
 */
export function progressOnRoute(route: RoutePlan, position: LatLng): number {
  const points = route.points;
  if (points.length < 2) return 0;

  const origin = points[0];
  const mPerLat = 110_540;
  const mPerLng = 111_320 * Math.cos(origin.lat * DEG);

  const toXY = (p: LatLng) => ({
    x: (p.lng - origin.lng) * mPerLng,
    y: (p.lat - origin.lat) * mPerLat,
  });

  const px = toXY(position);
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestAlong = 0;
  let accumulated = 0;

  for (let i = 1; i < points.length; i += 1) {
    const a = toXY(points[i - 1]);
    const b = toXY(points[i]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0
        ? 0
        : Math.max(0, Math.min(1, ((px.x - a.x) * dx + (px.y - a.y) * dy) / lengthSq));
    const projection = { x: a.x + dx * t, y: a.y + dy * t };
    const distance = Math.hypot(px.x - projection.x, px.y - projection.y);
    const segmentLength = Math.sqrt(lengthSq);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestAlong = accumulated + segmentLength * t;
    }
    accumulated += segmentLength;
  }

  return Math.max(0, Math.min(1, accumulated === 0 ? 0 : bestAlong / accumulated));
}

export function alongRouteM(route: RoutePlan, point: LatLng): number {
  return progressOnRoute(route, point) * pathLengthM(route.points);
}

export function distanceToRouteM(route: RoutePlan, position: LatLng): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let i = 0; i < route.points.length; i += 1) {
    nearest = Math.min(nearest, haversineM(position, route.points[i]));
  }
  return nearest;
}
