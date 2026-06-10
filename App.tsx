import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';

import { useBatteryOptimizationCheck } from './src/hooks/useBatteryOptimizationCheck';
import { usePendingHistoryDrain } from './src/hooks/usePendingHistoryDrain';
import { useNotificationResponseHandler } from './src/hooks/useNotificationResponseHandler';
import { setupNotificationsForAppLaunch } from './src/notifications/configureNotifications';
import HomeScreen, { type HomeScreenHandle } from './src/screens/HomeScreen';

export default function App() {
  const homeRef = useRef<HomeScreenHandle>(null);

  useEffect(() => {
    setupNotificationsForAppLaunch().catch((err) => {
      console.warn('[Notifications] Setup failed:', err);
    });
  }, []);

  usePendingHistoryDrain();
  useBatteryOptimizationCheck();

  useNotificationResponseHandler((regionId) => {
    homeRef.current?.navigateToSpotDetail(regionId);
  });

  return (
    <>
      <HomeScreen ref={homeRef} />
      <StatusBar style="dark" />
    </>
  );
}
