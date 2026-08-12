import { fill, getT, localeTag, type AppLanguage } from '../i18n/translations';
import type { ReminderSchedule, ScheduleDateMode } from '../types/reminder';

const WEEKDAY_REFERENCE_SUNDAY = new Date(2024, 0, 7);

export function parseTimeString(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function timeStringToMinutes(value: string): number | null {
  const parsed = parseTimeString(value);
  if (!parsed) {
    return null;
  }

  return parsed.hours * 60 + parsed.minutes;
}

export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** True when both times are set and From is strictly before To. */
export function isScheduleTimeRangeValid(schedule?: ReminderSchedule): boolean {
  if (!schedule?.timeStart || !schedule.timeEnd) {
    return true;
  }

  const start = timeStringToMinutes(schedule.timeStart);
  const end = timeStringToMinutes(schedule.timeEnd);
  if (start === null || end === null) {
    return true;
  }

  return start < end;
}

/** Ensures To is later than From when both times are present. */
export function clampScheduleTimeRange(schedule: ReminderSchedule): ReminderSchedule {
  if (!schedule.timeStart || !schedule.timeEnd) {
    return schedule;
  }

  const start = timeStringToMinutes(schedule.timeStart);
  const end = timeStringToMinutes(schedule.timeEnd);
  if (start === null || end === null || start < end) {
    return schedule;
  }

  const adjustedEnd = Math.min(start + 60, 23 * 60 + 59);
  if (adjustedEnd > start) {
    return { ...schedule, timeEnd: minutesToTimeString(adjustedEnd) };
  }

  return {
    ...schedule,
    timeStart: minutesToTimeString(Math.max(0, adjustedEnd - 1)),
    timeEnd: minutesToTimeString(adjustedEnd),
  };
}

export function formatTimeFromDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromScheduleDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function timeStringToDate(value: string, baseDate = new Date()): Date | null {
  const parsed = parseTimeString(value);
  if (!parsed) {
    return null;
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    parsed.hours,
    parsed.minutes,
    0,
    0,
  );
}

export function hasScheduleDateRestriction(schedule?: ReminderSchedule): boolean {
  return getScheduleDateMode(schedule) !== 'none';
}

export function getScheduleDateMode(schedule?: ReminderSchedule): ScheduleDateMode | 'none' {
  if (!schedule) {
    return 'none';
  }

  if (schedule.repeat === 'daily') {
    return 'daily';
  }

  if (schedule.weekdays && schedule.weekdays.length > 0) {
    return 'weekly';
  }

  if (schedule.date) {
    return 'once';
  }

  if (schedule.repeat === 'once') {
    return 'oneshot';
  }

  return 'none';
}

export function hasScheduleTiming(schedule?: ReminderSchedule): boolean {
  return Boolean(
    schedule?.timeStart ||
      schedule?.timeEnd ||
      schedule?.date ||
      schedule?.repeat === 'daily' ||
      schedule?.repeat === 'once' ||
      (schedule?.weekdays && schedule.weekdays.length > 0),
  );
}

function normalizeScheduleWeekdays(weekdays?: number[]): number[] | undefined {
  if (!weekdays?.length) {
    return undefined;
  }

  const normalized = [...new Set(weekdays.filter((day) => day >= 0 && day <= 6))].sort(
    (left, right) => left - right,
  );

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeScheduleDateFields(schedule: ReminderSchedule): ReminderSchedule {
  const next: ReminderSchedule = { ...schedule };

  if (next.repeat === 'daily' || next.repeat === 'once') {
    delete next.date;
    delete next.weekdays;
    return next;
  }

  const weekdays = normalizeScheduleWeekdays(next.weekdays);
  if (weekdays) {
    next.weekdays = weekdays;
    delete next.date;
    delete next.repeat;
    return next;
  }

  delete next.weekdays;
  delete next.repeat;
  return next;
}

export function normalizeSchedule(schedule?: ReminderSchedule): ReminderSchedule | undefined {
  if (!schedule) {
    return undefined;
  }

  const normalized: ReminderSchedule = {};
  if (schedule.date) {
    normalized.date = schedule.date;
  }
  if (schedule.repeat === 'daily' || schedule.repeat === 'once') {
    normalized.repeat = schedule.repeat;
  }
  const weekdays = normalizeScheduleWeekdays(schedule.weekdays);
  if (weekdays) {
    normalized.weekdays = weekdays;
  }
  if (schedule.timeStart) {
    normalized.timeStart = schedule.timeStart;
  }
  if (schedule.timeEnd) {
    normalized.timeEnd = schedule.timeEnd;
  }

  if (Object.keys(normalized).length === 0) {
    return undefined;
  }

  return clampScheduleTimeRange(normalizeScheduleDateFields(normalized));
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Whether the schedule's date rules include the given local calendar day. */
export function isScheduleActiveOnDate(schedule: ReminderSchedule | undefined, date: Date): boolean {
  if (!schedule || !hasScheduleDateRestriction(schedule)) {
    return true;
  }

  if (schedule.repeat === 'daily' || schedule.repeat === 'once') {
    return true;
  }

  if (schedule.weekdays && schedule.weekdays.length > 0) {
    return schedule.weekdays.includes(date.getDay());
  }

  if (schedule.date) {
    const scheduledDate = dateFromScheduleDate(schedule.date);
    if (!scheduledDate) {
      return false;
    }

    return (
      date.getFullYear() === scheduledDate.getFullYear() &&
      date.getMonth() === scheduledDate.getMonth() &&
      date.getDate() === scheduledDate.getDate()
    );
  }

  return true;
}

function isScheduleDateActiveNow(schedule: ReminderSchedule, now: Date): boolean {
  return isScheduleActiveOnDate(schedule, now);
}

/** Whether geofence / time-based reminders should fire right now. */
export function isScheduleActiveNow(schedule?: ReminderSchedule, now = new Date()): boolean {
  if (!schedule || !hasScheduleTiming(schedule)) {
    return true;
  }

  if (!isScheduleDateActiveNow(schedule, now)) {
    return false;
  }

  const nowMinutes = minutesSinceMidnight(now);

  if (schedule.timeStart) {
    const start = parseTimeString(schedule.timeStart);
    if (start && nowMinutes < start.hours * 60 + start.minutes) {
      return false;
    }
  }

  if (schedule.timeEnd) {
    const end = parseTimeString(schedule.timeEnd);
    if (end && nowMinutes > end.hours * 60 + end.minutes) {
      return false;
    }
  }

  return true;
}

export function formatScheduleTimeLabel(value?: string, language?: AppLanguage): string {
  if (!value) {
    return getT(language).notSet;
  }

  const date = timeStringToDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleTimeString(localeTag(language), {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatScheduleDateLabel(
  value?: string,
  language?: AppLanguage,
  notSetLabel = 'Not set',
): string {
  if (!value) {
    return notSetLabel;
  }

  const date = dateFromScheduleDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString(localeTag(language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatWeekdayLabel(day: number, language?: AppLanguage): string {
  const date = new Date(WEEKDAY_REFERENCE_SUNDAY);
  date.setDate(WEEKDAY_REFERENCE_SUNDAY.getDate() + day);
  return date.toLocaleDateString(localeTag(language), { weekday: 'short' });
}

export function formatScheduleWeekdaysLabel(
  weekdays: number[],
  language?: AppLanguage,
): string {
  return [...weekdays]
    .sort((left, right) => left - right)
    .map((day) => formatWeekdayLabel(day, language))
    .join(', ');
}

export function formatScheduleDateRepeatLabel(
  schedule?: ReminderSchedule,
  language?: AppLanguage,
  everyDayLabel = 'Every day',
  notSetLabel = 'Not set',
): string | null {
  if (!schedule) {
    return null;
  }

  if (schedule.repeat === 'daily') {
    return everyDayLabel;
  }

  if (schedule.repeat === 'once') {
    return getT(language).daysOnce;
  }

  if (schedule.weekdays && schedule.weekdays.length > 0) {
    return formatScheduleWeekdaysLabel(schedule.weekdays, language);
  }

  if (schedule.date) {
    return formatScheduleDateLabel(schedule.date, language, notSetLabel);
  }

  return null;
}

export function formatScheduleSummary(
  schedule?: ReminderSchedule,
  language?: AppLanguage,
): string | null {
  if (!schedule || !hasScheduleTiming(schedule)) {
    return null;
  }

  const t = getT(language);
  const parts: string[] = [];

  if (schedule.timeStart && schedule.timeEnd) {
    parts.push(
      fill(t.betweenTimes, {
        start: formatScheduleTimeLabel(schedule.timeStart, language),
        end: formatScheduleTimeLabel(schedule.timeEnd, language),
      }),
    );
  } else if (schedule.timeStart) {
    parts.push(
      fill(t.atTime, { time: formatScheduleTimeLabel(schedule.timeStart, language) }),
    );
  } else if (schedule.timeEnd) {
    parts.push(
      fill(t.untilTime, { time: formatScheduleTimeLabel(schedule.timeEnd, language) }),
    );
  }

  const dateLabel = formatScheduleDateRepeatLabel(
    schedule,
    language,
    t.everyDay,
    t.notSet,
  );
  if (dateLabel) {
    if (schedule.repeat === 'daily') {
      parts.push(t.everyDayLower);
    } else if (schedule.repeat === 'once') {
      parts.push(t.daysOnce);
    } else {
      parts.push(fill(t.onDate, { date: dateLabel }));
    }
  }

  return parts.join(' ');
}

const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5];

function isMondayToFriday(weekdays: number[]): boolean {
  if (weekdays.length !== WEEKDAYS_MON_FRI.length) {
    return false;
  }
  const sorted = [...weekdays].sort((a, b) => a - b);
  return WEEKDAYS_MON_FRI.every((day, index) => sorted[index] === day);
}

function formatDetailDatePart(
  schedule: ReminderSchedule | undefined,
  language: AppLanguage | undefined,
): string {
  const t = getT(language);
  const mode = getScheduleDateMode(schedule);

  if (mode === 'daily') {
    return t.everyDay;
  }

  if (mode === 'oneshot' || mode === 'none') {
    return t.daysOnce;
  }

  if (mode === 'weekly' && schedule?.weekdays?.length) {
    if (isMondayToFriday(schedule.weekdays)) {
      return fill(t.weekdaysMonFri, {
        start: formatWeekdayLabel(1, language),
        end: formatWeekdayLabel(5, language),
      });
    }
    return formatScheduleWeekdaysLabel(schedule.weekdays, language);
  }

  if (mode === 'once' && schedule?.date) {
    const date = dateFromScheduleDate(schedule.date);
    if (date) {
      return date.toLocaleDateString(localeTag(language), { weekday: 'long' });
    }
    return formatScheduleDateLabel(schedule.date, language, t.notSet);
  }

  return t.everyDay;
}

function formatDetailTimePart(
  schedule: ReminderSchedule | undefined,
  language: AppLanguage | undefined,
): string {
  const t = getT(language);
  const start = schedule?.timeStart
    ? formatScheduleTimeLabel(schedule.timeStart, language)
    : null;
  const end = schedule?.timeEnd ? formatScheduleTimeLabel(schedule.timeEnd, language) : null;

  if (start && end) {
    return `${start}–${end}`;
  }
  if (start) {
    return `${start}–${t.anytime}`;
  }
  if (end) {
    return `${t.anytime}–${end}`;
  }
  return t.anyTime;
}

export type SpotDetailReminderSummary = {
  label: string;
  value: string;
  muted: boolean;
};

/** Compact, human-readable reminder summary for Spot Details. */
export function formatSpotDetailReminderSummary(
  enabled: boolean,
  schedule: ReminderSchedule | undefined,
  language?: AppLanguage,
): SpotDetailReminderSummary {
  const t = getT(language);

  if (!enabled) {
    return {
      label: t.reminderSection,
      value: t.off,
      muted: true,
    };
  }

  const datePart = formatDetailDatePart(schedule, language);
  const timePart = formatDetailTimePart(schedule, language);

  return {
    label: t.reminderSchedule,
    value: `${datePart} · ${timePart}`,
    muted: false,
  };
}
