import { l, type Lang, type TripOption } from './content';

export type GeoPoint = {
  lat: number;
  lng: number;
};

type ApiTransitLeg = {
  mode: 'WALK' | 'BUS' | 'RAIL';
  duration_s: number;
  distance_m?: number;
  line?: string | null;
  line_short?: string | null;
  line_color?: string | null;
  headsign?: string | null;
  board_stop?: string | null;
  alight_stop?: string | null;
  departure_at?: string | null;
  arrival_at?: string | null;
  num_stops?: number;
  occupancy?: 'seats' | 'standing' | 'full' | 'unknown';
  seats_left?: number | null;
  occupancy_source?: string;
};

type ApiItinerary = {
  id: string;
  duration_s: number;
  walk_s: number;
  transfers: number;
  legs: ApiTransitLeg[];
  next_departures_min?: number[];
  demo?: boolean;
  provider?: string;
  realtime?: boolean;
  summary?: string;
};

export type ApiTransitPlan = {
  destination: {
    name: string;
    address?: string;
    lat: number;
    lng: number;
  };
  itineraries: ApiItinerary[];
  provider: string;
  demo: boolean;
  note?: string;
  generated_at: string;
};

const LINE_COLORS = ['#B0002A', '#B45309', '#1D4ED8', '#0F766E'];

function normalizeColor(value: string | null | undefined, index: number): string {
  if (!value) return LINE_COLORS[index % LINE_COLORS.length];
  return value.startsWith('#') ? value : `#${value}`;
}

function minutes(seconds: number): number {
  return Math.max(0, Math.round(seconds / 60));
}

export async function planTransit(
  text: string,
  origin: GeoPoint,
  lang: Lang,
): Promise<ApiTransitPlan> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch('/api/transit/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        lat: origin.lat,
        lng: origin.lng,
        lang,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Transit planner returned ${response.status}.`);
    }

    return (await response.json()) as ApiTransitPlan;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function toTripOptions(response: ApiTransitPlan): TripOption[] {
  return response.itineraries.map((itinerary, index) => {
    const busLegs = itinerary.legs.filter((leg) => leg.mode !== 'WALK');
    const firstBus = busLegs[0];
    const lastBus = busLegs[busLegs.length - 1];
    const board = firstBus?.board_stop ?? response.destination.name;
    const alight = lastBus?.alight_stop ?? response.destination.name;
    const seatCounts = busLegs
      .map((leg) => leg.seats_left)
      .filter((value): value is number => typeof value === 'number');
    const seats = seatCounts.length ? Math.min(...seatCounts) : null;
    const occupancy =
      seats != null
        ? 'seats'
        : busLegs.some((leg) => leg.occupancy === 'standing')
          ? 'standing'
          : 'unknown';

    const nextValue = itinerary.next_departures_min?.[0];
    const departure = firstBus?.departure_at
      ? new Date(firstBus.departure_at).getTime()
      : null;
    const next =
      typeof nextValue === 'number'
        ? Math.max(0, Math.round(nextValue))
        : departure != null
          ? Math.max(0, Math.round((departure - Date.now()) / 60_000))
          : 0;

    const arrivalAt =
      lastBus?.arrival_at ??
      new Date(Date.now() + itinerary.duration_s * 1000).toISOString();
    const rideSeconds = busLegs.reduce((sum, leg) => sum + leg.duration_s, 0);
    const stops = busLegs.reduce(
      (sum, leg) => sum + (leg.num_stops ?? 0),
      0,
    );

    return {
      id: itinerary.id || `api-${index + 1}`,
      line: firstBus?.line?.trim() || firstBus?.line_short?.trim() || `Bus ${index + 1}`,
      color: normalizeColor(firstBus?.line_color, index),
      board: l(board, board),
      alight,
      walk: minutes(itinerary.walk_s),
      ride: minutes(rideSeconds || itinerary.duration_s),
      stops,
      seats,
      occupancy,
      next,
      arrivalAt,
      provider: itinerary.provider ?? response.provider,
      demo: Boolean(itinerary.demo ?? response.demo),
      realtime: Boolean(itinerary.realtime),
    };
  });
}
