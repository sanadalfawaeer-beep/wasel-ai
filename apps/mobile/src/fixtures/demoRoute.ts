import type { Destination, LatLng, RoutePlan } from '@/types';

const POINTS: LatLng[] = [
  { lat: 32.0134, lng: 35.8734 },
  { lat: 32.0139, lng: 35.8734 },
  { lat: 32.0143, lng: 35.8735 },
  { lat: 32.0145, lng: 35.8739 },
  { lat: 32.0142, lng: 35.8743 },
  { lat: 32.0138, lng: 35.8743 },
  { lat: 32.0137, lng: 35.8739 },
  { lat: 32.0135, lng: 35.8738 },
];

const EN_DESTINATION: Destination = {
  name: 'University of Jordan Library',
  address: 'University of Jordan, Amman, Jordan',
  lat: 32.0135,
  lng: 35.8738,
};

const AR_DESTINATION: Destination = {
  name: 'مكتبة الجامعة الأردنية',
  address: 'الجامعة الأردنية، عمّان، الأردن',
  lat: 32.0135,
  lng: 35.8738,
};

export function demoRoute(lang: 'en' | 'ar' = 'en'): RoutePlan {
  const ar = lang === 'ar';
  return {
    route_id: `local-demo-${lang}`,
    destination: ar ? AR_DESTINATION : EN_DESTINATION,
    polyline: '',
    points: POINTS,
    distance_m: 300,
    duration_s: 260,
    provider: 'local-demo',
    language: lang,
    cues: [
      {
        id: 'cue_1',
        kind: 'DEPART',
        say: ar
          ? 'ابدأ المشي شمالًا نحو الممر الرئيسي.'
          : 'Start walking north toward the main walkway.',
        detail: ar
          ? 'ابدأ المشي شمالًا نحو الممر الرئيسي.'
          : 'Start walking north toward the main walkway.',
        short: ar ? 'ابدأ' : 'Start',
        at: POINTS[0],
        trigger_m: 0,
        haptic: 'tick',
        urgency: 'normal',
      },
      {
        id: 'cue_2',
        kind: 'TURN_RIGHT',
        say: ar
          ? 'بعد ٣٠ مترًا، انعطف يمينًا نحو ساحة المكتبة.'
          : 'In 30 meters, turn right toward the library plaza.',
        detail: ar
          ? 'انعطف يمينًا نحو ساحة المكتبة.'
          : 'Turn right toward the library plaza.',
        short: ar ? 'يمينًا' : 'Turn right',
        at: POINTS[2],
        trigger_m: 30,
        haptic: 'right',
        urgency: 'normal',
      },
      {
        id: 'cue_3',
        kind: 'TURN_LEFT',
        say: ar
          ? 'بعد ٣٠ مترًا، انعطف يسارًا عند مدخل المكتبة.'
          : 'In 30 meters, turn left at the library entrance.',
        detail: ar
          ? 'انعطف يسارًا عند مدخل المكتبة.'
          : 'Turn left at the library entrance.',
        short: ar ? 'يسارًا' : 'Turn left',
        at: POINTS[4],
        trigger_m: 30,
        haptic: 'left',
        urgency: 'normal',
      },
      {
        id: 'cue_4',
        kind: 'CONTINUE',
        say: ar
          ? 'أكمل مستقيمًا بعد النافورة لمسافة ٤٠ مترًا.'
          : 'Continue straight past the fountain for 40 meters.',
        detail: ar
          ? 'أكمل مستقيمًا بعد النافورة لمسافة ٤٠ مترًا.'
          : 'Continue straight past the fountain for 40 meters.',
        short: ar ? 'أكمل' : 'Continue',
        at: POINTS[6],
        trigger_m: 20,
        haptic: 'tick',
        urgency: 'normal',
      },
      {
        id: 'cue_5',
        kind: 'ARRIVE',
        say: ar
          ? `لقد وصلت إلى ${AR_DESTINATION.name}.`
          : `You have arrived at ${EN_DESTINATION.name}.`,
        detail: ar
          ? `لقد وصلت إلى ${AR_DESTINATION.name}.`
          : `You have arrived at ${EN_DESTINATION.name}.`,
        short: ar ? 'الوصول' : 'Arrive',
        at: POINTS[POINTS.length - 1],
        trigger_m: 12,
        haptic: 'arrive',
        urgency: 'normal',
      },
    ],
  };
}
