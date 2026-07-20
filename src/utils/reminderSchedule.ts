import type { ReminderSchedule } from '../types/reminder';

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

export function hasScheduleTiming(schedule?: ReminderSchedule): boolean {
  return Boolean(schedule?.timeStart || schedule?.timeEnd || schedule?.date);
}

export function normalizeSchedule(schedule?: ReminderSchedule): ReminderSchedule | undefined {
  if (!schedule) {
    return undefined;
  }

  const normalized: ReminderSchedule = {};
  if (schedule.date) {
    normalized.date = schedule.date;
  }
  if (schedule.timeStart) {
    normalized.timeStart = schedule.timeStart;
  }
  if (schedule.timeEnd) {
    normalized.timeEnd = schedule.timeEnd;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Whether geofence / time-based reminders should fire right now. */
export function isScheduleActiveNow(schedule?: ReminderSchedule, now = new Date()): boolean {
  if (!schedule || !hasScheduleTiming(schedule)) {
    return true;
  }

  if (schedule.date) {
    const scheduledDate = dateFromScheduleDate(schedule.date);
    if (!scheduledDate) {
      return true;
    }

    const sameDay =
      now.getFullYear() === scheduledDate.getFullYear() &&
      now.getMonth() === scheduledDate.getMonth() &&
      now.getDate() === scheduledDate.getDate();
    if (!sameDay) {
      return false;
    }
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

export function formatScheduleTimeLabel(value?: string): string {
  if (!value) {
    return 'Not set';
  }

  const date = timeStringToDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatScheduleDateLabel(value?: string): string {
  if (!value) {
    return 'Not set';
  }

  const date = dateFromScheduleDate(value);
  if (!date) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatScheduleSummary(schedule?: ReminderSchedule): string | null {
  if (!schedule || !hasScheduleTiming(schedule)) {
    return null;
  }

  const parts: string[] = [];

  if (schedule.timeStart && schedule.timeEnd) {
    parts.push(
      `Between ${formatScheduleTimeLabel(schedule.timeStart)} and ${formatScheduleTimeLabel(schedule.timeEnd)}`,
    );
  } else if (schedule.timeStart) {
    parts.push(`At ${formatScheduleTimeLabel(schedule.timeStart)}`);
  } else if (schedule.timeEnd) {
    parts.push(`Until ${formatScheduleTimeLabel(schedule.timeEnd)}`);
  }

  if (schedule.date) {
    parts.push(`on ${formatScheduleDateLabel(schedule.date)}`);
  }

  return parts.join(' ');
}
