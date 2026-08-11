import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';
import { useEffect, useState } from 'react';

import { getT } from '../i18n/translations';
import { requestForegroundThenBackgroundPermissions } from '../services/locationPermissions';

export type UserLocationStatus =
  | { kind: 'loading' }
  | { kind: 'services_disabled' }
  | { kind: 'foreground_denied' }
  | { kind: 'position_error'; message: string }
  | { kind: 'ok'; latitude: number; longitude: number; backgroundGranted: boolean };

export function useUserLocation(enabled = true): UserLocationStatus {
  const [status, setStatus] = useState<UserLocationStatus>({ kind: 'loading' });

  useEffect(() => {
    if (!enabled) {
      setStatus({ kind: 'loading' });
      return;
    }

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

      const existing = await Location.getForegroundPermissionsAsync();
      if (cancelled) {
        return;
      }

      let foregroundGranted = existing.granted;
      let backgroundGranted = false;

      if (existing.granted) {
        const background = await Location.getBackgroundPermissionsAsync();
        if (cancelled) {
          return;
        }
        backgroundGranted = background.granted;
        if (!background.granted && background.canAskAgain !== false) {
          const requestedBackground = await Location.requestBackgroundPermissionsAsync();
          if (cancelled) {
            return;
          }
          backgroundGranted = requestedBackground.granted;
        }
      } else if (existing.canAskAgain !== false) {
        const permissions = await requestForegroundThenBackgroundPermissions();
        if (cancelled) {
          return;
        }
        foregroundGranted = permissions.foregroundGranted;
        backgroundGranted = permissions.backgroundGranted;
      }

      if (!foregroundGranted) {
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
          backgroundGranted,
        });
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : getT().couldNotReadLocation;
        setStatus({ kind: 'position_error', message });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return status;
}
