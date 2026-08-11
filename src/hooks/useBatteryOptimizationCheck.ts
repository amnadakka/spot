import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import { useEffect, useRef } from 'react';
import { Alert, AppState, type AppStateStatus, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useI18n } from '../i18n/I18nContext';

const DISMISSED_KEY = '@spot_battery_opt_dismissed_v1';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // Re-ask after 7 days.

/**
 * On Android, checks whether battery optimization is enabled for this app.
 * If so, shows a one-time alert explaining why "Unrestricted" is needed,
 * then deep-links to the system Battery Optimization settings list.
 *
 * This is the Google-approved approach — it opens the **system settings list**
 * (`ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS`) rather than the per-app
 * whitelist dialog (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`), which requires
 * special Play Store justification.
 *
 * The prompt is shown once per session. If the user dismisses it, it won't
 * appear again for 7 days (persisted in AsyncStorage).
 */
export function useBatteryOptimizationCheck(enabled = true): void {
  const { t } = useI18n();
  const prompted = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      return;
    }

    async function check() {
      if (prompted.current) {
        return;
      }

      try {
        const optimized = await Battery.isBatteryOptimizationEnabledAsync();
        if (!optimized) {
          return;
        }

        const dismissed = await AsyncStorage.getItem(DISMISSED_KEY);
        if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10);
          if (Date.now() - dismissedAt < SNOOZE_MS) {
            return;
          }
        }

        prompted.current = true;
        const strings = tRef.current;
        Alert.alert(strings.batteryOptTitle, strings.batteryOptBody, [
          {
            text: strings.notNow,
            style: 'cancel',
            onPress: () => {
              void AsyncStorage.setItem(DISMISSED_KEY, String(Date.now()));
            },
          },
          {
            text: strings.openSettings,
            style: 'default',
            onPress: openBatteryOptimizationSettings,
          },
        ], { cancelable: true });
      } catch {
        // Battery API unavailable — skip silently.
      }
    }

    // Check on mount (cold start).
    void check();

    // Re-check when the user comes back from settings.
    function handleAppState(nextState: AppStateStatus) {
      if (nextState === 'active') {
        prompted.current = false;
        void check();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [enabled]);
}

function openBatteryOptimizationSettings() {
  void IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS,
  ).catch(() => {
    // Fallback: some OEMs don't support this intent. Try the general battery settings.
    void IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.BATTERY_SAVER_SETTINGS,
    ).catch(() => {
      // Last resort — nothing we can do.
    });
  });
}
