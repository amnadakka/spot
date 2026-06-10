import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { drainPendingHistory } from '../storage/pendingHistory';

/**
 * Drains the pending geofence-history queue whenever the app enters the foreground.
 *
 * Background task enqueues lightweight stubs; this hook promotes them to full
 * HistoryEvent records (with metadata from AsyncStorage) at the first safe moment.
 */
export function usePendingHistoryDrain(): void {
  const draining = useRef(false);

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    function drain() {
      if (draining.current) {
        return;
      }
      draining.current = true;
      drainPendingHistory()
        .catch((e) => console.warn('[History] Drain failed:', e))
        .finally(() => {
          draining.current = false;
        });
    }

    // Drain on mount (covers cold start after a background trigger).
    drain();

    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active') {
        drain();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);
}
