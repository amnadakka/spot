import { reloadAppAsync } from 'expo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nManager } from 'react-native';

import { loadLanguage, saveLanguage, type AppLanguage } from '../storage/preferences';
import {
  isRtlLanguage,
  setCachedLanguage,
  translations,
  type AppTranslations,
} from './translations';

type I18nContextValue = {
  language: AppLanguage;
  t: AppTranslations;
  isRTL: boolean;
  setLanguage: (language: AppLanguage) => void;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

async function applyRtlIfNeeded(language: AppLanguage): Promise<void> {
  const shouldRTL = isRtlLanguage(language);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL === shouldRTL) {
    return;
  }
  I18nManager.forceRTL(shouldRTL);
  await reloadAppAsync('rtl-language-change');
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadLanguage().then(async (loaded) => {
      if (cancelled) return;
      setCachedLanguage(loaded);
      setLanguageState(loaded);
      await applyRtlIfNeeded(loaded);
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    setCachedLanguage(next);
    setLanguageState(next);
    void saveLanguage(next);
    void import('../notifications/configureNotifications').then(({ ensureNotificationsReady }) =>
      ensureNotificationsReady(),
    );
    void applyRtlIfNeeded(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      t: translations[language],
      isRTL: isRtlLanguage(language),
      setLanguage,
      ready,
    }),
    [language, setLanguage, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
