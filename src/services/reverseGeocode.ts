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

export async function forwardGeocode(query: string): Promise<
  Array<{ latitude: number; longitude: number; label: string }>
> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const results = await Location.geocodeAsync(trimmed);
    return results.slice(0, 5).map((result, index) => ({
      latitude: result.latitude,
      longitude: result.longitude,
      label: trimmed + (results.length > 1 ? ` (${index + 1})` : ''),
    }));
  } catch {
    return [];
  }
}
