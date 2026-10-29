import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Preferences, RoutePlan } from '@/types';

const PREFS_KEY = 'wasel.prefs.v1';
const ROUTE_KEY = 'wasel.route.v1';

export const DEFAULT_PREFS: Preferences = {
  profile: 'blind',
  lang: 'en',
  themeMode: 'auto',
  textScale: 1,
  voiceRate: 1,
  haptics: true,
  stepFree: true,
  avoidStairs: true,
  preferLit: false,
  motion: 'system',
  onboarded: false,
};

interface AppContextValue {
  prefs: Preferences;
  route: RoutePlan | null;
  hydrated: boolean;
  updatePrefs: (patch: Partial<Preferences>) => void;
  setRoute: (route: RoutePlan | null) => void;
  resetOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [route, setRouteState] = useState<RoutePlan | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [storedPrefs, storedRoute] = await Promise.all([
          AsyncStorage.getItem(PREFS_KEY),
          AsyncStorage.getItem(ROUTE_KEY),
        ]);
        if (!active) return;
        if (storedPrefs) {
          const parsed = JSON.parse(storedPrefs) as Partial<Preferences>;
          setPrefs({ ...DEFAULT_PREFS, ...parsed });
        }
        if (storedRoute) {
          setRouteState(JSON.parse(storedRoute) as RoutePlan);
        }
      } catch {
        // A corrupt local value should never block the app.
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updatePrefs = useCallback((patch: Partial<Preferences>) => {
    setPrefs((previous) => {
      const next = { ...previous, ...patch };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const setRoute = useCallback((next: RoutePlan | null) => {
    setRouteState(next);
    if (next) {
      AsyncStorage.setItem(ROUTE_KEY, JSON.stringify(next)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(ROUTE_KEY).catch(() => undefined);
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    updatePrefs({ onboarded: false });
  }, [updatePrefs]);

  const value = useMemo(
    () => ({ prefs, route, hydrated, updatePrefs, setRoute, resetOnboarding }),
    [prefs, route, hydrated, updatePrefs, setRoute, resetOnboarding],
  );

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2DD4BF" size="large" />
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1117',
  },
});
