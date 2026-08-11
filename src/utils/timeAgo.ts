import { fill, getT, localeTag, type AppLanguage } from '../i18n/translations';

export function timeAgo(isoDate: string, language?: AppLanguage): string {
  const t = getT(language);
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return fill(t.daysAgo, { count: diffDays });
  }
  if (diffHours >= 1) {
    return fill(t.hoursAgo, { count: diffHours });
  }
  if (diffMinutes >= 1) {
    return fill(t.minutesAgo, { count: diffMinutes });
  }
  return t.justNow;
}

export function formatLocalDateTimeLocalized(
  isoDate: string,
  language?: AppLanguage,
): string {
  return new Date(isoDate).toLocaleString(localeTag(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
