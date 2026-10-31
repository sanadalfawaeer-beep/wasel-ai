export type Lang = 'en' | 'ar';
export type Profile = 'blind' | 'deaf' | 'deafblind';
export type ThemeMode = 'auto' | 'night' | 'daylight';
export type MotionPreference = 'system' | 'reduced' | 'full';
export type TextScale = 1 | 1.25 | 1.5 | 2;
export type VoiceRate = 0.8 | 1 | 1.2;

export type CueKind =
  | 'DEPART'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'TURN_SLIGHT_LEFT'
  | 'TURN_SLIGHT_RIGHT'
  | 'TURN_SHARP_LEFT'
  | 'TURN_SHARP_RIGHT'
  | 'UTURN_LEFT'
  | 'UTURN_RIGHT'
  | 'CONTINUE'
  | 'ROUNDABOUT_LEFT'
  | 'ROUNDABOUT_RIGHT'
  | 'RAMP_LEFT'
  | 'RAMP_RIGHT'
  | 'FORK_LEFT'
  | 'FORK_RIGHT'
  | 'MERGE'
  | 'ARRIVE'
  | 'WARN'
  | 'LANDMARK';

export type HapticPattern = 'left' | 'right' | 'arrive' | 'warn' | 'tick';
export type Urgency = 'normal' | 'imminent' | 'critical';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Cue {
  id: string;
  kind: CueKind;
  say: string;
  detail: string;
  short: string;
  at: LatLng;
  trigger_m: number;
  haptic: HapticPattern;
  urgency: Urgency;
}

export interface Destination {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RoutePlan {
  route_id: string;
  destination: Destination;
  polyline: string;
  points: LatLng[];
  distance_m: number;
  duration_s: number;
  cues: Cue[];
  provider: string;
  language: Lang;
}

export type TransitMode = 'WALK' | 'BUS' | 'RAIL';
export type OccupancyLevel = 'seats' | 'standing' | 'full' | 'unknown';
export type OccupancySource = 'simulated' | 'reported' | 'operator' | 'unknown';

export interface TransitLeg {
  mode: TransitMode;
  line?: string | null;
  line_short?: string | null;
  line_color?: string | null;
  headsign?: string | null;
  board_stop?: string | null;
  alight_stop?: string | null;
  departure_at?: string | null;
  arrival_at?: string | null;
  duration_s: number;
  distance_m: number;
  num_stops: number;
  occupancy: OccupancyLevel;
  seats_left?: number | null;
  occupancy_source: OccupancySource;
  occupancy_updated_at?: string | null;
}

export interface TransitItinerary {
  id: string;
  duration_s: number;
  walk_s: number;
  transfers: number;
  legs: TransitLeg[];
  next_departures_min: number[];
  demo: boolean;
  provider: string;
  realtime: boolean;
  summary: string;
}

export interface TransitPlanResponse {
  destination: Destination;
  itineraries: TransitItinerary[];
  provider: string;
  demo: boolean;
  note: string;
  generated_at: string;
}

export interface PlanResponse {
  reply: string;
  route: RoutePlan;
  debug?: {
    mode?: string;
    model?: string | null;
    planner?: string;
    constraints?: string[];
    tool_log?: Array<{
      tool: string;
      args?: Record<string, unknown>;
      result?: unknown;
    }>;
  } | null;
}

export interface Preferences {
  profile: Profile;
  lang: Lang;
  themeMode: ThemeMode;
  textScale: TextScale;
  voiceRate: VoiceRate;
  haptics: boolean;
  stepFree: boolean;
  avoidStairs: boolean;
  preferLit: boolean;
  motion: MotionPreference;
  onboarded: boolean;
}

export type AgentStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface AgentStep {
  id: string;
  label: string;
  detail?: string;
  status: AgentStepStatus;
}
