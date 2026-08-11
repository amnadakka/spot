import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppThemeId } from '../theme/colors';

const LANGUAGE_KEY = '@spot_language_v1';
const THEME_KEY = '@spot_theme_v1';
const ONBOARDING_KEY = '@spot_onboarding_completed_v1';

export type AppLanguage = 'en' | 'de' | 'ar';

export async function loadLanguage(): Promise<AppLanguage> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value === 'de' || value === 'ar') return value;
  return 'en';
}

export async function saveLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function loadTheme(): Promise<AppThemeId> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  if (value === 'ducky' || value === 'night') return value;
  return 'default';
}

export async function saveTheme(theme: AppThemeId): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function loadOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === '1';
}

export async function saveOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, '1');
}
