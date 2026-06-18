import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';
import { useEffect, useState } from 'react';

import type { Coordinate } from '../utils/geo';

/**
 * Streams the user's foreground position for live UI (home map + occupied-spot highlighting).
 */
export function useLiveUserLocation(): Coordinate | null {
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn || cancelled) {
        return;
      }

      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || cancelled) {
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown && !cancelled) {
        setCoordinate({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoordinate({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch {
        // Keep last-known position if a fresh fix is unavailable.
      }

      if (cancelled) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 3000,
        },
        (position) => {
          setCoordinate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
      );
    }

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return coordinate;
}
