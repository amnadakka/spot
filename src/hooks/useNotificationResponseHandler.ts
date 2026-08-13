import { InteractionManager } from 'react-native';
import { useEffect, useRef } from 'react';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { GEOFENCE_ALARM_ACTION_DISMISS } from '../notifications/constants';

type NotificationResponse = {
  actionIdentifier: string;
  notification: { request: { content: { data: Record<string, unknown> } } };
};

function isGeofenceEnterResponse(data: Record<string, unknown> | undefined): data is {
  type: 'geofence_enter';
  regionId: string;
  batchStartedAt?: number;
} {
  return data?.type === 'geofence_enter' && typeof data.regionId === 'string';
}

type NotificationResponseHandler = {
  onOpen: (regionId: string) => void;
  onDismiss: () => void;
};

/**
 * Listens for notification taps and action buttons. Geofence alarms open the ringing
 * screen, or dismiss without foregrounding the app.
 *
 * Handles:
 * 1. App already running — `addNotificationResponseReceivedListener`
 * 2. Cold start from notification — `getLastNotificationResponseAsync` after UI is ready
 */
export function useNotificationResponseHandler({
  onOpen,
  onDismiss,
}: NotificationResponseHandler): void {
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const handledResponseKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    function deferOpen(regionId: string): void {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          onOpenRef.current(regionId);
        });
      });
    }

    function handleResponse(response: NotificationResponse, fromColdStart: boolean): void {
      const data = response.notification.request.content.data;

      if (!isGeofenceEnterResponse(data)) {
        return;
      }

      const isDismiss = response.actionIdentifier === GEOFENCE_ALARM_ACTION_DISMISS;
      const responseKey = `${isDismiss ? 'dismiss' : 'open'}:${data.regionId}:${data.batchStartedAt ?? ''}`;
      if (handledResponseKeysRef.current.has(responseKey)) {
        return;
      }
      handledResponseKeysRef.current.add(responseKey);

      if (isDismiss) {
        // An old dismiss stored as "last response" must not cancel a newer alarm.
        if (fromColdStart) {
          return;
        }
        onDismissRef.current();
        return;
      }

      deferOpen(data.regionId);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: NotificationResponse) => {
        handleResponse(response, false);
      },
    );

    const readyTask = InteractionManager.runAfterInteractions(() => {
      void Notifications.getLastNotificationResponseAsync().then(
        (response: NotificationResponse | null) => {
          if (response) {
            handleResponse(response, true);
          }
        },
      );
    });

    return () => {
      subscription.remove();
      readyTask.cancel();
    };
  }, []);
}
