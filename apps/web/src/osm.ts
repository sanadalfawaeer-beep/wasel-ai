import type { Lang } from './content';

export type OsmPlace = {
  lat: number;
  lon: number;
  label: string;
  labelAr?: string;
  address?: string;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

const LOCAL_PLACES: Array<{ keys: string[]; place: OsmPlace }> = [
  {
    keys: ['city mall', 'سيتي مول'],
    place: {
      lat: 31.976,
      lon: 35.849,
      label: 'City Mall, Amman',
      labelAr: 'سيتي مول',
      address: 'City Mall, Amman',
    },
  },
  {
    keys: ['downtown', 'وسط البلد'],
    place: {
      lat: 31.951,
      lon: 35.923,
      label: 'Downtown Amman',
      labelAr: 'وسط البلد',
      address: 'Downtown Amman',
    },
  },
  {
    keys: ['abdoun', 'عبدون'],
    place: {
      lat: 31.95,
      lon: 35.88,
      label: 'Abdoun, Amman',
      labelAr: 'عبدون',
      address: 'Abdoun, Amman',
    },
  },
  {
    keys: ['sweileh', 'صويلح'],
    place: {
      lat: 32.0197,
      lon: 35.8347,
      label: 'Sweileh, Amman',
      labelAr: 'صويلح',
      address: 'Sweileh, Amman',
    },
  },
  {
    keys: ['sports city', 'المدينة الرياضية'],
    place: {
      lat: 31.9936,
      lon: 35.8579,
      label: 'Sports City, Amman',
      labelAr: 'المدينة الرياضية',
      address: 'Sports City, Amman',
    },
  },
  {
    keys: ['7th circle', 'الدوار السابع'],
    place: {
      lat: 31.9952,
      lon: 35.8663,
      label: '7th Circle, Amman',
      labelAr: 'الدوار السابع',
      address: '7th Circle, Amman',
    },
  },
];

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export function localPlace(query: string, lang: Lang = 'en'): OsmPlace | null {
  const value = normalized(query);
  const match = LOCAL_PLACES.find((item) =>
    item.keys.some((key) => value.includes(key.toLowerCase())),
  );
  if (!match) return null;
  const label =
    lang === 'ar' ? match.place.labelAr ?? match.place.label : match.place.label;
  return {
    ...match.place,
    label,
    address: label,
  };
}

export async function searchPlaces(query: string, lang: Lang): Promise<OsmPlace[]> {
  const local = localPlace(query, lang);
  if (local) return [local];

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'jo');
    url.searchParams.set('accept-language', lang === 'ar' ? 'ar,en' : 'en,ar');
    url.searchParams.set('q', query);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);

    const data = (await response.json()) as NominatimResult[];
    const seen = new Set<string>();
    const places: OsmPlace[] = [];

    for (const item of data) {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const address = item.display_name ?? query;
      const label = address.split(',')[0]?.trim() || query;
      places.push({ lat, lon, label, address });
    }

    return places;
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function geocodeDestination(
  query: string,
  lang: Lang,
): Promise<OsmPlace | null> {
  const places = await searchPlaces(query, lang);
  return places[0] ?? null;
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
