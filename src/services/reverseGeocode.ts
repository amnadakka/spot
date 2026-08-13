import * as Location from 'expo-location';

import { formatCoordinateLabel } from './formatCoordinateLabel';

export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const place = results[0];
      const parts = [
        place.name,
        place.street,
        place.city ?? place.subregion,
        place.region,
      ].filter((part): part is string => Boolean(part && part.trim()));

      const unique = [...new Set(parts)];
      if (unique.length > 0) {
        return unique.join(', ');
      }
    }
  } catch {
    // Fall back to coordinate label.
  }

  return formatCoordinateLabel(latitude, longitude);
}
