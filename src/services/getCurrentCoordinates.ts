import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';

import { getT } from '../i18n/translations';

/**
 * Reads one GPS fix after ensuring services are on and foreground location is granted.
 * Does not trigger the background permission prompt (only foreground is needed here).
 */
export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const t = getT();
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw new Error(t.turnOnLocationServices);
  }

  let foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) {
    foreground = await Location.requestForegroundPermissionsAsync();
  }
  if (!foreground.granted) {
    throw new Error(t.locationPermissionRequired);
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
