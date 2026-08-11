import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill, localeTag } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { Reminder } from '../types/reminder';
import {
  formatDateFromDate,
  formatScheduleSummary,
  hasScheduleTiming,
  isScheduleActiveOnDate,
} from '../utils/reminderSchedule';

function isReminderScheduledOnDate(reminder: Reminder, date: Date): boolean {
  // Always-on spots without a schedule stay on Home — calendar focuses on dated windows.
  if (!hasScheduleTiming(reminder.schedule)) {
    return false;
  }

  return isScheduleActiveOnDate(reminder.schedule, date);
}

type CalendarScreenProps = {
  reminders: Reminder[];
  onSpotPress?: (reminderId: string) => void;
};

type CalendarCell = {
  key: string;
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasReminders: boolean;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthCells(month: Date, reminders: Reminder[], today: Date): CalendarCell[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Week starts on Sunday to match Date#getDay().
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayOffset = index - leadingDays;
    const date = new Date(year, monthIndex, dayOffset + 1);
    const isCurrentMonth = date.getMonth() === monthIndex;
    const hasReminders = reminders.some((reminder) =>
      isReminderScheduledOnDate(reminder, date),
    );

    cells.push({
      key: `${formatDateFromDate(date)}-${index}`,
      date,
      dayNumber: date.getDate(),
      isToday: isSameDay(date, today),
      isCurrentMonth,
      hasReminders,
    });
  }

  return cells;
}

export default function CalendarScreen({ reminders, onSpotPress }: CalendarScreenProps) {
  const { t, language, isRTL } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => today);

  const weekdayLabels = useMemo(() => {
    const sunday = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, day) => {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + day);
      return date.toLocaleDateString(localeTag(language), { weekday: 'narrow' });
    });
  }, [language]);

  const monthLabel = useMemo(
    () =>
      visibleMonth.toLocaleDateString(localeTag(language), {
        month: 'long',
        year: 'numeric',
      }),
    [language, visibleMonth],
  );

  const selectedDateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString(localeTag(language), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [language, selectedDate],
  );

  const cells = useMemo(
    () => buildMonthCells(visibleMonth, reminders, today),
    [reminders, today, visibleMonth],
  );

  const rowCount = cells.length / 7;

  const dayReminders = useMemo(
    () => reminders.filter((reminder) => isReminderScheduledOnDate(reminder, selectedDate)),
    [reminders, selectedDate],
  );

  const goToPreviousMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable
            style={({ pressed }) => [styles.monthNavBtn, pressed && styles.monthNavBtnPressed]}
            onPress={goToPreviousMonth}
            accessibilityLabel={t.calendarPreviousMonthA11y}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Pressable
            style={({ pressed }) => [styles.monthNavBtn, pressed && styles.monthNavBtnPressed]}
            onPress={goToNextMonth}
            accessibilityLabel={t.calendarNextMonthA11y}
          >
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {weekdayLabels.map((label, index) => (
            <Text key={`weekday-${index}`} style={styles.weekdayLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell, index) => {
            const selected = isSameDay(cell.date, selectedDate);
            const col = index % 7;
            const row = Math.floor(index / 7);
            const isLastCol = col === 6;
            const isLastRow = row === rowCount - 1;

            return (
              <Pressable
                key={cell.key}
                style={({ pressed }) => [
                  styles.dayCell,
                  !isLastCol && styles.dayCellBorderEnd,
                  !isLastRow && styles.dayCellBorderBottom,
                  cell.isToday && !selected && styles.dayCellToday,
                  pressed && !selected && styles.dayCellPressed,
                ]}
                onPress={() => {
                  setSelectedDate(cell.date);
                  if (!cell.isCurrentMonth) {
                    setVisibleMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                  }
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={cell.date.toLocaleDateString(localeTag(language), {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              >
                {selected ? <View style={styles.dayCellSelectedRing} pointerEvents="none" /> : null}
                <Text
                  style={[
                    styles.dayNumber,
                    !cell.isCurrentMonth && styles.dayNumberOutside,
                    cell.isToday && !selected && styles.dayNumberToday,
                    selected && styles.dayNumberSelected,
                  ]}
                >
                  {cell.dayNumber}
                </Text>
                {cell.hasReminders ? (
                  <View
                    style={[
                      styles.dayMarker,
                      !cell.isCurrentMonth && styles.dayMarkerOutside,
                      selected && styles.dayMarkerSelected,
                    ]}
                  />
                ) : (
                  <View style={styles.dayMarkerPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dayDetails}>
        <Text style={styles.dayDetailsTitle}>{selectedDateLabel}</Text>
        <Text style={styles.dayDetailsSubtitle}>
          {dayReminders.length === 0
            ? t.calendarNoReminders
            : fill(t.calendarReminderCount, { count: dayReminders.length })}
        </Text>

        {dayReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={28} color={colors.slate400} />
            <Text style={styles.emptyText}>{t.calendarEmptyHint}</Text>
          </View>
        ) : (
          <FlatList
            data={dayReminders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const scheduleLabel =
                formatScheduleSummary(item.schedule, language) ?? t.anyTime;

              return (
                <Pressable
                  style={({ pressed }) => [styles.reminderCard, pressed && styles.reminderCardPressed]}
                  onPress={() => onSpotPress?.(item.id)}
                  disabled={!onSpotPress}
                >
                  <View
                    style={[
                      styles.reminderIcon,
                      !item.enabled && styles.reminderIconPaused,
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={item.enabled ? colors.accent : colors.slate400}
                    />
                  </View>
                  <View style={styles.reminderCopy}>
                    <Text style={styles.reminderTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.reminderMeta} numberOfLines={1}>
                      {scheduleLabel}
                    </Text>
                    <Text style={styles.reminderAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  <View style={styles.reminderStatus}>
                    <Text
                      style={[
                        styles.reminderStatusLabel,
                        item.enabled ? styles.reminderStatusActive : styles.reminderStatusPaused,
                      ]}
                    >
                      {item.enabled ? t.statusActive : t.statusPaused}
                    </Text>
                    {onSpotPress ? (
                      <Ionicons
                        name={isRTL ? 'chevron-back' : 'chevron-forward'}
                        size={16}
                        color={colors.slate400}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnPressed: {
    backgroundColor: colors.slate100,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dayCellBorderEnd: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.borderStrong,
  },
  dayCellBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  dayCellToday: {
    backgroundColor: colors.primaryLight,
  },
  dayCellSelectedRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.slate700,
  },
  dayCellPressed: {
    backgroundColor: colors.slate50,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  dayNumberOutside: {
    color: colors.slate300,
    fontWeight: '500',
  },
  dayNumberToday: {
    color: colors.accent,
  },
  dayNumberSelected: {
    color: colors.foreground,
    fontWeight: '700',
  },
  dayMarker: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent,
  },
  dayMarkerOutside: {
    backgroundColor: colors.slate300,
  },
  dayMarkerSelected: {
    backgroundColor: colors.accent,
  },
  dayMarkerPlaceholder: {
    width: 14,
    height: 3,
  },
  dayDetails: {
    flex: 1,
    minHeight: 0,
  },
  dayDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  dayDetailsSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.slate400,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  reminderCardPressed: {
    backgroundColor: colors.slate50,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderIconPaused: {
    backgroundColor: colors.slate100,
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  reminderMeta: {
    fontSize: 13,
    color: colors.accent,
  },
  reminderAddress: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  reminderStatus: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  reminderStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  reminderStatusActive: {
    color: colors.success,
  },
  reminderStatusPaused: {
    color: colors.slate400,
  },
}));
