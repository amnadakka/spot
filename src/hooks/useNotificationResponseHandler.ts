import { InteractionManager } from 'react-native';
import { useEffect, useRef } from 'react';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';

type NotificationResponse = {
  notification: { request: { content: { data: Record<string, unknown> } } };
};

function isGeofenceEnterResponse(data: Record<string, unknown> | undefined): data is {
  type: 'geofence_enter';
  regionId: string;
} {
  return data?.type === 'geofence_enter' && typeof data.regionId === 'string';
}

/**
 * Listens for notification taps (response events). Geofence alarms open the ringing
 * screen.
 *
 * Handles:
 * 1. App already running — `addNotificationResponseReceivedListener`
 * 2. Cold start from notification — `getLastNotificationResponseAsync` after UI is ready
 */
export function useNotificationResponseHandler(
  onGeofenceNavigate: (regionId: string) => void,
): void {
  const onGeofenceNavigateRef = useRef(onGeofenceNavigate);
  onGeofenceNavigateRef.current = onGeofenceNavigate;
  const handledResponseKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    function deferNavigate(regionId: string): void {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          onGeofenceNavigateRef.current(regionId);
        });
      });
    }

    function handleResponse(response: NotificationResponse): void {
      const data = response.notification.request.content.data;

      if (!isGeofenceEnterResponse(data)) {
        return;
      }

      const responseKey = `geofence:${data.regionId}`;
      if (handledResponseKeysRef.current.has(responseKey)) {
        return;
      }
      handledResponseKeysRef.current.add(responseKey);

      deferNavigate(data.regionId);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    const readyTask = InteractionManager.runAfterInteractions(() => {
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          handleResponse(response);
        }
      });
    });

    return () => {
      subscription.remove();
      readyTask.cancel();
    };
  }, []);
}
