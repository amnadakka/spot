import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import GeofenceAlarmRingingLayer from './src/components/GeofenceAlarmRingingLayer';
import OnboardingPermissionsScreen from './src/components/OnboardingPermissionsScreen';
import { useBatteryOptimizationCheck } from './src/hooks/useBatteryOptimizationCheck';
import { useFullScreenIntentCheck } from './src/hooks/useFullScreenIntentCheck';
import { useGeofenceAlarmRinging } from './src/hooks/useGeofenceAlarmRinging';
import { usePendingHistoryDrain } from './src/hooks/usePendingHistoryDrain';
import { useNotificationResponseHandler } from './src/hooks/useNotificationResponseHandler';
import { I18nProvider, useI18n } from './src/i18n/I18nContext';
import {
  ensureNotificationsReady,
  setupNotificationsForAppLaunch,
} from './src/notifications/configureNotifications';
import HomeScreen, { type HomeScreenHandle } from './src/screens/HomeScreen';
import {
  loadOnboardingCompleted,
  saveOnboardingCompleted,
} from './src/storage/preferences';
import { makeStyles } from './src/theme/makeStyles';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <AppContent />
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { ready: i18nReady } = useI18n();
  const { theme, colors, ready: themeReady } = useTheme();
  const styles = useStyles();
  const homeRef = useRef<HomeScreenHandle>(null);
  const completedOnboardingThisSession = useRef(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const { activeAlarm, dismissActiveAlarm, viewActiveAlarmSpot, startAlarmForRegion } =
    useGeofenceAlarmRinging((regionId, options) => {
      homeRef.current?.navigateToSpotDetail(regionId, options);
    });

  useEffect(() => {
    let cancelled = false;

    async function resolveOnboarding() {
      const completed = await loadOnboardingCompleted();
      if (cancelled) {
        return;
      }

      if (completed) {
        setNeedsOnboarding(false);
        setOnboardingChecked(true);
        return;
      }

      // Existing installs that already granted location skip the new first-run screen.
      try {
        const foreground = await Location.getForegroundPermissionsAsync();
        if (foreground.granted) {
          await saveOnboardingCompleted();
          if (!cancelled) {
            setNeedsOnboarding(false);
            setOnboardingChecked(true);
          }
          return;
        }
      } catch {
        // Fall through to onboarding.
      }

      if (!cancelled) {
        setNeedsOnboarding(true);
        setOnboardingChecked(true);
      }
    }

    void resolveOnboarding();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Channel setup is safe before onboarding; permission prompts wait until after.
    void ensureNotificationsReady().catch((err) => {
      console.warn('[Notifications] Channel setup failed:', err);
    });
  }, []);

  useEffect(() => {
    if (!onboardingChecked || needsOnboarding) {
      return;
    }

    // First-run grants happen in the onboarding UI — don't re-prompt immediately after.
    if (completedOnboardingThisSession.current) {
      return;
    }

    setupNotificationsForAppLaunch().catch((err) => {
      console.warn('[Notifications] Setup failed:', err);
    });
  }, [onboardingChecked, needsOnboarding]);

  usePendingHistoryDrain();
  useBatteryOptimizationCheck(!needsOnboarding && onboardingChecked);
  useFullScreenIntentCheck(!needsOnboarding && onboardingChecked);

  useNotificationResponseHandler({
    onOpen: startAlarmForRegion,
    onDismiss: dismissActiveAlarm,
  });

  const handleOnboardingComplete = useCallback(() => {
    completedOnboardingThisSession.current = true;
    void saveOnboardingCompleted();
    setNeedsOnboarding(false);
  }, []);

  if (!i18nReady || !themeReady || !onboardingChecked) {
    return (
      <View style={styles.boot}>
        <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (needsOnboarding) {
    return (
      <>
        <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
        <OnboardingPermissionsScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'night' ? 'light' : 'dark'} />
      <HomeScreen ref={homeRef} />
      {activeAlarm ? (
        <GeofenceAlarmRingingLayer
          alarm={activeAlarm}
          onDismiss={dismissActiveAlarm}
          onViewSpot={viewActiveAlarmSpot}
        />
      ) : null}
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
}));
