import Constants from 'expo-constants';
import type { Lang, PlanResponse, RoutePlan, TransitPlanResponse } from '@/types';

const hostUri =
  Constants.expoConfig?.hostUri ??
  (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;

const derivedHost = hostUri?.split(':')[0];

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (derivedHost ? `http://${derivedHost}:8000` : 'http://localhost:8000');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 25_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let detail = `Request failed (${response.status})`;
      try {
        const payload = (await response.json()) as { detail?: string };
        if (payload.detail) detail = payload.detail;
      } catch {
        // Keep the status message.
      }
      throw new ApiError(detail, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The guide is taking too long. Try again.', 504);
    }
    throw new ApiError(`Cannot reach the guide at ${API_URL}.`, 0);
  } finally {
    clearTimeout(timer);
  }
}

export interface PlanInput {
  text: string;
  lat: number;
  lng: number;
  lang: Lang;
  constraints?: string[];
}

export function planRoute(input: PlanInput): Promise<PlanResponse> {
  return request<PlanResponse>('/api/plan', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getDemoPlan(lang: Lang): Promise<PlanResponse> {
  return request<PlanResponse>(`/api/demo?lang=${lang}`);
}

export function getHealth(): Promise<{
  status: string;
  mode: string;
  model: string | null;
  llm: boolean;
  google_key: boolean;
}> {
  return request('/api/health', { method: 'GET' }, 8_000);
}

export function demoRouteFromApi(response: PlanResponse): RoutePlan {
  return response.route;
}

export function planTransit(input: {
  text: string;
  lat: number;
  lng: number;
  lang: Lang;
}): Promise<TransitPlanResponse> {
  return request<TransitPlanResponse>(
    '/api/transit/plan',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    30_000,
  );
}
