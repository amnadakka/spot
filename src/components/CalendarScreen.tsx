import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

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

import { SpotSelectionActionBar } from './SpotList';
import ConfirmDialog from './ui/ConfirmDialog';

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
  onSetEnabledMany?: (ids: string[], enabled: boolean) => void;
  onDeleteMany?: (ids: string[]) => void;
  onAdd?: () => void;
  addDisabled?: boolean;
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

export default function CalendarScreen({
  reminders,
  onSpotPress,
  onSetEnabledMany,
  onDeleteMany,
  onAdd,
  addDisabled = false,
}: CalendarScreenProps) {
  const { t, language, isRTL } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  const selectedCount = selectedIds.size;
  const allSelected = dayReminders.length > 0 && selectedCount === dayReminders.length;
  const selectedReminders = useMemo(
    () => dayReminders.filter((reminder) => selectedIds.has(reminder.id)),
    [dayReminders, selectedIds],
  );
  const allSelectedEnabled =
    selectedReminders.length > 0 && selectedReminders.every((reminder) => reminder.enabled);
  const bulkEnable = !allSelectedEnabled;
  const canSelect = Boolean(onSetEnabledMany || onDeleteMany);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const enterSelection = useCallback((id: string) => {
    setSelecting(true);
    setSelectedIds(new Set([id]));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllPress = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(dayReminders.map((reminder) => reminder.id)));
  }, [allSelected, dayReminders]);

  const handleDeleteSelected = useCallback(() => {
    if (!onDeleteMany || selectedCount === 0) {
      return;
    }

    const ids = [...selectedIds];
    const message =
      selectedCount === 1
        ? t.deleteSpotConfirmOne
        : fill(t.deleteSpotsConfirmMany, { count: selectedCount });

    setDeleteConfirm({
      title: t.deleteSpotsTitle,
      message,
      onConfirm: () => {
        onDeleteMany(ids);
        exitSelection();
        setDeleteConfirm(null);
      },
    });
  }, [exitSelection, onDeleteMany, selectedCount, selectedIds, t]);

  const handleBulkToggle = useCallback(() => {
    if (!onSetEnabledMany || selectedCount === 0) {
      return;
    }
    onSetEnabledMany([...selectedIds], bulkEnable);
  }, [bulkEnable, onSetEnabledMany, selectedCount, selectedIds]);

  const handleAddPress = useCallback(() => {
    if (!onAdd) {
      return;
    }
    if (addDisabled) {
      Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
      return;
    }
    onAdd();
  }, [addDisabled, onAdd, t]);

  // Leave selection when the day changes or the list empties.
  useEffect(() => {
    exitSelection();
  }, [selectedDate, exitSelection]);

  useEffect(() => {
    if (selecting && dayReminders.length === 0) {
      exitSelection();
    }
  }, [dayReminders.length, exitSelection, selecting]);

  useEffect(() => {
    if (!selecting) {
      return;
    }
    const validIds = new Set(dayReminders.map((reminder) => reminder.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [dayReminders, selecting]);

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
        {selecting ? (
          <View style={styles.selectionHeader}>
            <Pressable
              style={({ pressed }) => [styles.selectAllBtn, pressed && styles.pressedSoft]}
              onPress={handleSelectAllPress}
              accessibilityRole="button"
              accessibilityLabel={allSelected ? t.deselectAll : t.selectAll}
            >
              <Text style={styles.selectAllLabel} numberOfLines={1}>
                {allSelected ? t.deselectAll : t.selectAll}
              </Text>
            </Pressable>
            <Text
              style={styles.selectionCount}
              accessibilityRole="text"
              accessibilityLiveRegion="polite"
            >
              {fill(t.selectedCount, { count: selectedCount })}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressedSoft]}
              onPress={exitSelection}
              accessibilityRole="button"
              accessibilityLabel={t.cancel}
            >
              <Text style={styles.cancelLabel}>{t.cancel}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.dayDetailsHeader}>
            <View style={styles.dayDetailsHeaderMain}>
              <Text style={styles.dayDetailsTitle}>{selectedDateLabel}</Text>
              <Text style={styles.dayDetailsSubtitle}>
                {dayReminders.length === 0
                  ? t.calendarNoReminders
                  : fill(t.calendarReminderCount, { count: dayReminders.length })}
              </Text>
            </View>
            {onAdd ? (
              <Pressable
                style={({ pressed }) => [
                  styles.addBtn,
                  addDisabled && styles.addBtnDisabled,
                  pressed && !addDisabled && styles.pressedSoft,
                ]}
                onPress={handleAddPress}
                accessibilityRole="button"
                accessibilityLabel={t.addNewSpotA11y}
                accessibilityState={{ disabled: addDisabled }}
              >
                <Ionicons
                  name="add"
                  size={26}
                  color={addDisabled ? colors.slate300 : colors.accent}
                />
              </Pressable>
            ) : null}
          </View>
        )}

        {dayReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={28} color={colors.slate400} />
            <Text style={styles.emptyText}>{t.calendarEmptyHint}</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            <FlatList
              data={dayReminders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                selecting && styles.listContentWithActionBar,
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const scheduleLabel =
                  formatScheduleSummary(item.schedule, language) ?? t.anyTime;
                const isSelected = selectedIds.has(item.id);

                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.reminderCard,
                      selecting && isSelected && styles.reminderCardSelected,
                      pressed && styles.reminderCardPressed,
                    ]}
                    onPress={() => {
                      if (selecting) {
                        toggleSelection(item.id);
                        return;
                      }
                      onSpotPress?.(item.id);
                    }}
                    onLongPress={() => {
                      if (canSelect && !selecting) {
                        enterSelection(item.id);
                      }
                    }}
                    delayLongPress={350}
                    accessibilityRole={selecting ? 'checkbox' : 'button'}
                    accessibilityState={selecting ? { checked: isSelected } : undefined}
                    accessibilityLabel={item.title}
                  >
                    {selecting ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected ? (
                          <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                        ) : null}
                      </View>
                    ) : (
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
                    )}
                    <View style={styles.reminderCopy}>
                      <Text
                        style={[
                          styles.reminderTitle,
                          selecting && isSelected && styles.reminderTitleSelected,
                          !item.enabled && !selecting && styles.reminderTitlePaused,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.reminderMeta} numberOfLines={1}>
                        {scheduleLabel}
                      </Text>
                      <Text style={styles.reminderAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    {!selecting ? (
                      <View style={styles.reminderStatus}>
                        <Text
                          style={[
                            styles.reminderStatusLabel,
                            item.enabled
                              ? styles.reminderStatusActive
                              : styles.reminderStatusPaused,
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
                    ) : null}
                  </Pressable>
                );
              }}
            />

            {selecting ? (
              <SpotSelectionActionBar
                selectedCount={selectedCount}
                bulkEnable={bulkEnable}
                onBulkToggle={handleBulkToggle}
                onDeleteSelected={handleDeleteSelected}
              />
            ) : null}
          </View>
        )}
      </View>

      <ConfirmDialog
        visible={deleteConfirm != null}
        title={deleteConfirm?.title ?? ''}
        message={deleteConfirm?.message ?? ''}
        cancelLabel={t.cancel}
        confirmLabel={t.delete}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm?.onConfirm()}
      />
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
  dayDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dayDetailsHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  dayDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  dayDetailsSubtitle: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    minHeight: 40,
    gap: spacing.sm,
  },
  selectAllBtn: {
    flexShrink: 1,
    minWidth: 48,
    maxWidth: 130,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  selectAllLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
  },
  selectionCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  cancelBtn: {
    flexShrink: 1,
    minWidth: 48,
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
  },
  pressedSoft: {
    opacity: 0.7,
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
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listContentWithActionBar: {
    paddingBottom: 120,
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
  reminderCardSelected: {
    backgroundColor: colors.slate50,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
  reminderTitlePaused: {
    color: colors.slate500,
  },
  reminderTitleSelected: {
    color: colors.slate400,
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
