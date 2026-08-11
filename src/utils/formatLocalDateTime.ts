import { localeTag, type AppLanguage } from '../i18n/translations';

/** Formats an ISO timestamp in the device's local timezone (minute precision). */
export function formatLocalDateTime(isoDate: string, language?: AppLanguage): string {
  return new Date(isoDate).toLocaleString(localeTag(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
