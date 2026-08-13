import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import {
  canUseFullScreenIntent,
  isSpotAlarmNativeAvailable,
} from '../services/spotAlarmNative';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type LocationPermissionStatus =
  | 'always'
  | 'while_in_use'
  | 'denied'
  | 'undetermined';

export type FullScreenIntentStatus = 'granted' | 'denied' | 'unsupported';

export type PermissionStatuses = {
  notifications: NotificationPermissionStatus;
  location: LocationPermissionStatus;
  fullScreenIntent: FullScreenIntentStatus;
  loading: boolean;
  refresh: () => void;
};

async function readNotificationStatus(): Promise<NotificationPermissionStatus> {
  if (isExpoGoAndroid()) {
    return 'denied';
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return 'granted';
  }

  if (current.canAskAgain === false) {
    return 'denied';
  }

  return current.status === 'denied' ? 'denied' : 'undetermined';
}

async function readFullScreenIntentStatus(): Promise<FullScreenIntentStatus> {
  if (Platform.OS !== 'android' || !isSpotAlarmNativeAvailable()) {
    return 'unsupported';
  }

  return canUseFullScreenIntent() ? 'granted' : 'denied';
}

async function readLocationStatus(): Promise<LocationPermissionStatus> {
  const foreground = await Location.getForegroundPermissionsAsync();

  if (!foreground.granted) {
    if (foreground.canAskAgain === false || foreground.status === 'denied') {
      return foreground.status === 'undetermined' ? 'undetermined' : 'denied';
    }
    return 'undetermined';
  }

  const background = await Location.getBackgroundPermissionsAsync();
  return background.granted ? 'always' : 'while_in_use';
}

export function usePermissionStatuses(): PermissionStatuses {
  const [notifications, setNotifications] = useState<NotificationPermissionStatus>('undetermined');
  const [location, setLocation] = useState<LocationPermissionStatus>('undetermined');
  const [fullScreenIntent, setFullScreenIntent] = useState<FullScreenIntentStatus>('unsupported');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [nextNotifications, nextLocation, nextFullScreenIntent] = await Promise.all([
          readNotificationStatus(),
          readLocationStatus(),
          readFullScreenIntentStatus(),
        ]);
        if (!cancelled) {
          setNotifications(nextNotifications);
          setLocation(nextLocation);
          setFullScreenIntent(nextFullScreenIntent);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active') {
        refresh();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [refresh]);

  return { notifications, location, fullScreenIntent, loading, refresh };
}
