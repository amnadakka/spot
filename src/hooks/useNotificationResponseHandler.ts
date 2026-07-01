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

function isScheduledReminderResponse(data: Record<string, unknown> | undefined): data is {
  type: 'scheduled_reminder';
  regionId: string;
} {
  return data?.type === 'scheduled_reminder' && typeof data.regionId === 'string';
}

/**
 * Listens for notification taps (response events). Geofence alarms open the ringing
 * screen; scheduled time reminders open spot details directly.
 *
 * Handles:
 * 1. App already running — `addNotificationResponseReceivedListener`
 * 2. Cold start from notification — `getLastNotificationResponseAsync` after UI is ready
 */
export function useNotificationResponseHandler(
  onGeofenceNavigate: (regionId: string) => void,
  onScheduledReminderNavigate?: (regionId: string) => void,
): void {
  const onGeofenceNavigateRef = useRef(onGeofenceNavigate);
  onGeofenceNavigateRef.current = onGeofenceNavigate;
  const onScheduledReminderNavigateRef = useRef(onScheduledReminderNavigate);
  onScheduledReminderNavigateRef.current = onScheduledReminderNavigate;
  const handledResponseKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    function deferNavigate(regionId: string, kind: 'geofence' | 'scheduled'): void {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          if (kind === 'scheduled') {
            onScheduledReminderNavigateRef.current?.(regionId);
            return;
          }
          onGeofenceNavigateRef.current(regionId);
        });
      });
    }

    function handleResponse(response: NotificationResponse): void {
      const data = response.notification.request.content.data;
      let regionId: string | null = null;
      let kind: 'geofence' | 'scheduled' | null = null;

      if (isGeofenceEnterResponse(data)) {
        regionId = data.regionId;
        kind = 'geofence';
      } else if (isScheduledReminderResponse(data)) {
        regionId = data.regionId;
        kind = 'scheduled';
      }

      if (!kind || !regionId) {
        return;
      }

      const responseKey = `${kind}:${regionId}`;
      if (handledResponseKeysRef.current.has(responseKey)) {
        return;
      }
      handledResponseKeysRef.current.add(responseKey);

      deferNavigate(regionId, kind);
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
