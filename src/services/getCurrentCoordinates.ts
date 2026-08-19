import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';

import { getT } from '../i18n/translations';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

async function ensureForegroundLocation(): Promise<void> {
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
}

function coordsFromPosition(position: Location.LocationObject): Coordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/** Cached GPS if the OS has one — typically returns immediately. */
export async function getLastKnownCoordinates(): Promise<Coordinates | null> {
  try {
    await ensureForegroundLocation();
  } catch {
    return null;
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  return lastKnown ? coordsFromPosition(lastKnown) : null;
}

/**
 * Reads one GPS fix after ensuring services are on and foreground location is granted.
 * Does not trigger the background permission prompt (only foreground is needed here).
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  await ensureForegroundLocation();
  const position = await Location.getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
  return coordsFromPosition(position);
}
