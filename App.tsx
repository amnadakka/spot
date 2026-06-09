import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { setupNotificationsForAppLaunch } from './src/notifications/configureNotifications';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  useEffect(() => {
    setupNotificationsForAppLaunch().catch((err) => {
      console.warn('[Notifications] Setup failed:', err);
    });
  }, []);

  return (
    <>
      <HomeScreen />
      <StatusBar style="dark" />
    </>
  );
}
