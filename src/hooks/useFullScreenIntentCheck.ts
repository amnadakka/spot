import * as IntentLauncher from 'expo-intent-launcher';
import { useEffect, useRef } from 'react';
import { Alert, AppState, type AppStateStatus, Linking, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useI18n } from '../i18n/I18nContext';
import {
  canUseFullScreenIntent,
  isSpotAlarmNativeAvailable,
  openFullScreenIntentSettings,
} from '../services/spotAlarmNative';

const DISMISSED_KEY = '@spot_fsi_prompt_dismissed_v1';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Android 14+ full-screen alarms need a special-access grant. Prompt once per
 * snooze window when the OS has not granted it, then deep-link to the system page.
 */
export function useFullScreenIntentCheck(enabled = true): void {
  const { t } = useI18n();
  const prompted = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled || !isSpotAlarmNativeAvailable()) {
      return;
    }

    async function check() {
      if (prompted.current) {
        return;
      }

      try {
        if (canUseFullScreenIntent()) {
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
        Alert.alert(strings.fullScreenIntentOptTitle, strings.fullScreenIntentOptBody, [
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
            onPress: () => {
              void openFullScreenIntentSettings().catch(openNotificationSettingsFallback);
            },
          },
        ], { cancelable: true });
      } catch {
        // Native module unavailable — skip silently.
      }
    }

    void check();

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

function openNotificationSettingsFallback() {
  void IntentLauncher.startActivityAsync(
    IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS,
  ).catch(() => {
    void Linking.openSettings();
  });
}
