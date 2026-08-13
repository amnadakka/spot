import Constants from 'expo-constants';

export function getGoogleMapsApiKey(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim();
  }

  return null;
}
