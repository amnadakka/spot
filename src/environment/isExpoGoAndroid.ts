import Constants from 'expo-constants';
import { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go on Android cannot use background location / geofencing / full notifications (SDK 53+). */
export function isExpoGoAndroid(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient && Platform.OS === 'android';
}
