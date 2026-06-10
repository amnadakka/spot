import { useEffect, useRef } from 'react';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';

/**
 * Listens for notification taps (response events). When the user taps a
 * geofence notification, calls `onNavigate` with the regionId so the app
 * can open the spot detail view.
 *
 * Handles two scenarios:
 * 1. App already in foreground — `addNotificationResponseReceivedListener`
 * 2. App launched from a notification — `getLastNotificationResponseAsync`
 */
export function useNotificationResponseHandler(
  onNavigate: (regionId: string) => void,
): void {
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    function handleResponse(response: { notification: { request: { content: { data: Record<string, unknown> } } } }) {
      const data = response.notification.request.content.data;
      if (data?.type === 'geofence_enter' && typeof data.regionId === 'string') {
        onNavigateRef.current(data.regionId);
      }
    }

    // Live listener for taps while the app is running.
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Cold-start: if the app was launched by tapping a notification.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleResponse(response);
      }
    });

    return () => subscription.remove();
  }, []);
}
