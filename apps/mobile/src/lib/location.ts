import * as Location from 'expo-location';
import type { LatLng } from '@/types';

export const DEFAULT_ORIGIN: LatLng = { lat: 32.0134, lng: 35.8734 };

export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === 'granted';
}

export async function getCurrentLocationSafe(fallback: LatLng = DEFAULT_ORIGIN): Promise<LatLng> {
  try {
    if (!(await ensureLocationPermission())) return fallback;

    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    if (lastKnown) {
      return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_000)),
    ]);

    if (!position) return fallback;
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return fallback;
  }
}

export async function watchLocation(
  onPosition: (position: LatLng) => void,
  onError: (message: string) => void,
): Promise<Location.LocationSubscription | null> {
  try {
    if (!(await ensureLocationPermission())) {
      onError('permission');
      return null;
    }
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 3,
        timeInterval: 1_000,
      },
      (position) => {
        onPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
    );
  } catch {
    onError('gps');
    return null;
  }
}
