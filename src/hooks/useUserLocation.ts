import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';
import { useEffect, useState } from 'react';

import { requestForegroundThenBackgroundPermissions } from '../services/locationPermissions';

export type UserLocationStatus =
  | { kind: 'loading' }
  | { kind: 'services_disabled' }
  | { kind: 'foreground_denied' }
  | { kind: 'position_error'; message: string }
  | { kind: 'ok'; latitude: number; longitude: number; backgroundGranted: boolean };

export function useUserLocation(): UserLocationStatus {
  const [status, setStatus] = useState<UserLocationStatus>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus({ kind: 'loading' });

      const servicesOn = await Location.hasServicesEnabledAsync();
      if (cancelled) {
        return;
      }

      if (!servicesOn) {
        setStatus({ kind: 'services_disabled' });
        return;
      }

      const permissions = await requestForegroundThenBackgroundPermissions();
      if (cancelled) {
        return;
      }

      if (!permissions.foregroundGranted) {
        setStatus({ kind: 'foreground_denied' });
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Accuracy.Balanced,
        });
        if (cancelled) {
          return;
        }

        setStatus({
          kind: 'ok',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          backgroundGranted: permissions.backgroundGranted,
        });
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : 'Could not read current location.';
        setStatus({ kind: 'position_error', message });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
