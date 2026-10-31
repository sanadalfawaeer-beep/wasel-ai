import type { Destination, Lang, TransitItinerary, TransitLeg, TransitPlanResponse } from '@/types';

function destinationFor(text: string, lang: Lang): Destination {
  const value = text.toLowerCase();
  if (value.includes('downtown') || value.includes('وسط البلد')) {
    return {
      name: lang === 'ar' ? 'وسط البلد' : 'Downtown Amman',
      address: lang === 'ar' ? 'عمّان، الأردن' : 'Amman, Jordan',
      lat: 31.951,
      lng: 35.923,
    };
  }
  if (value.includes('abdoun') || value.includes('عبدون')) {
    return {
      name: lang === 'ar' ? 'عبدون' : 'Abdoun',
      address: lang === 'ar' ? 'عمّان، الأردن' : 'Amman, Jordan',
      lat: 31.95,
      lng: 35.88,
    };
  }
  if (value.includes('sweileh') || value.includes('صويلح')) {
    return {
      name: lang === 'ar' ? 'صويلح' : 'Sweileh',
      address: lang === 'ar' ? 'عمّان، الأردن' : 'Amman, Jordan',
      lat: 32.0197,
      lng: 35.8347,
    };
  }
  return {
    name: lang === 'ar' ? 'سيتي مول' : 'City Mall',
    address: lang === 'ar' ? 'عمّان، الأردن' : 'Amman, Jordan',
    lat: 31.976,
    lng: 35.849,
  };
}

function isoInMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function walk(minutes: number, distance: number): TransitLeg {
  return {
    mode: 'WALK',
    duration_s: minutes * 60,
    distance_m: distance,
    num_stops: 0,
    occupancy: 'unknown',
    occupancy_source: 'unknown',
  };
}

function bus(
  line: string,
  lineShort: string,
  color: string,
  headsign: string,
  board: string,
  alight: string,
  departureMin: number,
  durationMin: number,
  stops: number,
  occupancy: 'seats' | 'standing' | 'full',
  seatsLeft: number | null,
): TransitLeg {
  return {
    mode: 'BUS',
    line,
    line_short: lineShort,
    line_color: color,
    headsign,
    board_stop: board,
    alight_stop: alight,
    departure_at: isoInMinutes(departureMin),
    arrival_at: isoInMinutes(departureMin + durationMin),
    duration_s: durationMin * 60,
    distance_m: durationMin * 250,
    num_stops: stops,
    occupancy,
    seats_left: seatsLeft,
    occupancy_source: 'simulated',
    occupancy_updated_at: new Date().toISOString(),
  };
}

export function demoTransit(lang: Lang, text = 'City Mall'): TransitPlanResponse {
  const destination = destinationFor(text, lang);
  const seventhCircle = lang === 'ar' ? 'موقف الدوار السابع' : '7th Circle Station';
  const sweilehStop = lang === 'ar' ? 'مجمع صويلح' : 'Sweileh Terminal';
  const sportsCity = lang === 'ar' ? 'المدينة الرياضية' : 'Sports City';
  const now = new Date().toISOString();

  const firstLegs: TransitLeg[] = [
    walk(4, 300),
    bus(
      'Amman Bus 100',
      '100',
      '#0F766E',
      destination.name,
      seventhCircle,
      destination.name,
      4,
      12,
      5,
      'seats',
      8,
    ),
    walk(3, 220),
  ];

  const secondLegs: TransitLeg[] = [
    walk(7, 520),
    bus(
      'Amman BRT 1',
      'BRT 1',
      '#B45309',
      sportsCity,
      sweilehStop,
      sportsCity,
      6,
      18,
      7,
      'standing',
      null,
    ),
    walk(2, 150),
    bus(
      'Amman Bus 101',
      '101',
      '#1D4ED8',
      destination.name,
      sportsCity,
      destination.name,
      26,
      10,
      4,
      'standing',
      null,
    ),
    walk(5, 360),
  ];

  const summarize = (legs: TransitLeg[]): string =>
    legs
      .map((leg) => {
        const minutes = Math.round(leg.duration_s / 60);
        if (leg.mode === 'WALK') {
          return lang === 'ar' ? `مشي ${minutes} د` : `Walk ${minutes} min`;
        }
        return lang === 'ar'
          ? `باص ${leg.line_short} · ${minutes} د · ${leg.num_stops} محطات`
          : `Bus ${leg.line_short} · ${minutes} min · ${leg.num_stops} stops`;
      })
      .join(' · ');

  const itineraries: TransitItinerary[] = [
    {
      id: 'local-demo-1',
      duration_s: 19 * 60,
      walk_s: 7 * 60,
      transfers: 0,
      legs: firstLegs,
      next_departures_min: [4, 14, 24],
      demo: true,
      provider: 'local-demo',
      realtime: false,
      summary: summarize(firstLegs),
    },
    {
      id: 'local-demo-2',
      duration_s: 42 * 60,
      walk_s: 14 * 60,
      transfers: 1,
      legs: secondLegs,
      next_departures_min: [6, 16, 26],
      demo: true,
      provider: 'local-demo',
      realtime: false,
      summary: summarize(secondLegs),
    },
  ];

  return {
    destination,
    itineraries,
    provider: 'local-demo',
    demo: true,
    note:
      lang === 'ar'
        ? 'بيانات تجريبية محلية: أوقات الباص وعدد المقاعد محاكاة.'
        : 'Local demo data: bus times and seat counts are simulated.',
    generated_at: now,
  };
}
