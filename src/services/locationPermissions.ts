/**
 * All runtime permission prompts for location are triggered here via expo-location:
 *
 * - `requestForegroundPermissionsAsync()` — while-in-use (and Android approximate/fine flow).
 * - `requestBackgroundPermissionsAsync()` — always / background; on Android 11+ this may open
 *   system settings after foreground access is granted.
 *
 * The strings shown in those dialogs and native capabilities (e.g. iOS background location,
 * Android background location in the manifest) come from the `expo-location` config plugin
 * in `app.json`, not from this file.
 */
import * as Location from 'expo-location';

export type AppLocationPermissionResult = {
  foregroundGranted: boolean;
  backgroundGranted: boolean;
};

export async function requestForegroundThenBackgroundPermissions(): Promise<AppLocationPermissionResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();

  if (!foreground.granted) {
    return { foregroundGranted: false, backgroundGranted: false };
  }

  const background = await Location.requestBackgroundPermissionsAsync();

  return {
    foregroundGranted: true,
    backgroundGranted: background.granted,
  };
}
