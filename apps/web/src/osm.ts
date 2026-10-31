import type { Lang } from './content';

export type OsmPlace = {
  lat: number;
  lon: number;
  label: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

const LOCAL_PLACES: Array<{ keys: string[]; place: OsmPlace }> = [
  {
    keys: ['city mall', 'سيتي مول'],
    place: { lat: 31.976, lon: 35.849, label: 'City Mall, Amman' },
  },
  {
    keys: ['downtown', 'وسط البلد'],
    place: { lat: 31.951, lon: 35.923, label: 'Downtown Amman' },
  },
  {
    keys: ['abdoun', 'عبدون'],
    place: { lat: 31.95, lon: 35.88, label: 'Abdoun, Amman' },
  },
  {
    keys: ['sweileh', 'صويلح'],
    place: { lat: 32.0197, lon: 35.8347, label: 'Sweileh, Amman' },
  },
  {
    keys: ['sports city', 'المدينة الرياضية'],
    place: { lat: 31.9936, lon: 35.8579, label: 'Sports City, Amman' },
  },
  {
    keys: ['7th circle', 'الدوار السابع'],
    place: { lat: 31.9952, lon: 35.8663, label: '7th Circle, Amman' },
  },
];

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function localPlace(query: string): OsmPlace | null {
  const value = normalized(query);
  const match = LOCAL_PLACES.find((item) =>
    item.keys.some((key) => value.includes(key.toLowerCase())),
  );
  return match?.place ?? null;
}

export async function geocodeDestination(
  query: string,
  lang: Lang,
): Promise<OsmPlace | null> {
  const fallback = localPlace(query);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'jo');
    url.searchParams.set('accept-language', lang === 'ar' ? 'ar,en' : 'en,ar');
    url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);

    const data = (await response.json()) as NominatimResult[];
    const first = data[0];
    if (!first) return fallback;

    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return fallback;

    return {
      lat,
      lon,
      label: first.display_name ?? query,
    };
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function osmEmbedUrl(place: OsmPlace): string {
  const delta = 0.008;
  const bbox = [
    place.lon - delta,
    place.lat - delta,
    place.lon + delta,
    place.lat + delta,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${place.lat}%2C${place.lon}`;
}
