import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GeofenceAlarmRingingLayer from './src/components/GeofenceAlarmRingingLayer';
import { useBatteryOptimizationCheck } from './src/hooks/useBatteryOptimizationCheck';
import { useGeofenceAlarmRinging } from './src/hooks/useGeofenceAlarmRinging';
import { usePendingHistoryDrain } from './src/hooks/usePendingHistoryDrain';
import { useNotificationResponseHandler } from './src/hooks/useNotificationResponseHandler';
import { setupNotificationsForAppLaunch } from './src/notifications/configureNotifications';
import HomeScreen, { type HomeScreenHandle } from './src/screens/HomeScreen';

export default function App() {
  const homeRef = useRef<HomeScreenHandle>(null);

  const { activeAlarm, dismissActiveAlarm, viewActiveAlarmSpot, startAlarmForRegion } =
    useGeofenceAlarmRinging((regionId, options) => {
      homeRef.current?.navigateToSpotDetail(regionId, options);
    });

  useEffect(() => {
    setupNotificationsForAppLaunch().catch((err) => {
      console.warn('[Notifications] Setup failed:', err);
    });
  }, []);

  usePendingHistoryDrain();
  useBatteryOptimizationCheck();

  useNotificationResponseHandler(
    (regionId) => {
      startAlarmForRegion(regionId);
    },
    (regionId) => {
      homeRef.current?.navigateToSpotDetail(regionId);
    },
  );

  return (
    <SafeAreaProvider>
      <HomeScreen ref={homeRef} />
      {activeAlarm ? (
        <GeofenceAlarmRingingLayer
          alarm={activeAlarm}
          onDismiss={dismissActiveAlarm}
          onViewSpot={viewActiveAlarmSpot}
        />
      ) : null}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
