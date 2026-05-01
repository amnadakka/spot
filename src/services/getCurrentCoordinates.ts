import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';

/**
 * Reads one GPS fix after ensuring services are on and foreground location is granted.
 * Does not trigger the background permission prompt (only foreground is needed here).
 */
export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw new Error('Turn on location services to use your current position.');
  }

  let foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) {
    foreground = await Location.requestForegroundPermissionsAsync();
  }
  if (!foreground.granted) {
    throw new Error('Location permission is required to use your current position.');
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
