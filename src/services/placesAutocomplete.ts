import { getGoogleMapsApiKey } from './googleMapsApiKey';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  secondaryLabel?: string;
  distanceMeters?: number;
};

export type PlaceDetails = {
  placeId: string;
  latitude: number;
  longitude: number;
  address: string;
  displayName?: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      distanceMeters?: number;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type LatLng = { latitude: number; longitude: number };

type PlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  displayName?: { text?: string };
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

export function createPlacesSessionToken(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function fetchPlaceSuggestions(
  query: string,
  options?: {
    sessionToken?: string;
    origin?: LatLng;
    locationBias?: LatLng & { radiusMeters?: number };
  },
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return [];
  }

  const body: Record<string, unknown> = {
    input: trimmed,
  };

  if (options?.sessionToken) {
    body.sessionToken = options.sessionToken;
  }

  if (options?.origin) {
    body.origin = {
      latitude: options.origin.latitude,
      longitude: options.origin.longitude,
    };
  }

  if (options?.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.locationBias.latitude,
          longitude: options.locationBias.longitude,
        },
        radius: options.locationBias.radiusMeters ?? 50_000,
      },
    };
  }

  try {
    const response = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.distanceMeters',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as AutocompleteResponse;
    const results: PlaceSuggestion[] = [];

    for (const suggestion of data.suggestions ?? []) {
      const prediction = suggestion.placePrediction;
      const placeId = prediction?.placeId?.trim();
      if (!prediction || !placeId) {
        continue;
      }

      const label =
        prediction.structuredFormat?.mainText?.text?.trim() ||
        prediction.text?.text?.trim() ||
        placeId;
      const secondaryLabel = prediction.structuredFormat?.secondaryText?.text?.trim();
      const distanceMeters =
        typeof prediction.distanceMeters === 'number' ? prediction.distanceMeters : undefined;

      results.push({
        placeId,
        label,
        ...(secondaryLabel ? { secondaryLabel } : {}),
        ...(distanceMeters != null ? { distanceMeters } : {}),
      });
    }

    results.sort((left, right) => {
      const leftDistance = left.distanceMeters ?? Number.POSITIVE_INFINITY;
      const rightDistance = right.distanceMeters ?? Number.POSITIVE_INFINITY;
      return leftDistance - rightDistance;
    });

    return results.slice(0, 8);
  } catch {
    return [];
  }
}

export async function fetchPlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceDetails | null> {
  const trimmedId = placeId.trim();
  if (!trimmedId) {
    return null;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return null;
  }

  const params = new URLSearchParams();
  if (sessionToken) {
    params.set('sessionToken', sessionToken);
  }

  const query = params.toString();
  const url = `${PLACE_DETAILS_URL}/${encodeURIComponent(trimmedId)}${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PlaceDetailsResponse;
    const latitude = data.location?.latitude;
    const longitude = data.location?.longitude;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return null;
    }

    const displayName = data.displayName?.text?.trim();
    const formattedAddress = data.formattedAddress?.trim();
    const address = formattedAddress || displayName || trimmedId;

    return {
      placeId: data.id ?? trimmedId,
      latitude,
      longitude,
      address,
      displayName,
    };
  } catch {
    return null;
  }
}
