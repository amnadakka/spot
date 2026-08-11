import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import {
  REMINDER_RADIUS_OPTIONS,
  type ReminderRadiusMeters,
  type ReminderSchedule,
  type ScheduleDateMode,
} from '../types/reminder';
import {
  clampScheduleTimeRange,
  dateFromScheduleDate,
  formatDateFromDate,
  formatScheduleDateLabel,
  formatScheduleTimeLabel,
  formatTimeFromDate,
  formatWeekdayLabel,
  getScheduleDateMode,
  timeStringToDate,
} from '../utils/reminderSchedule';

import Toggle from './ui/Toggle';

type PickerKind = 'date' | 'timeStart' | 'timeEnd';

const WEEKDAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ReminderScheduleFieldsProps = {
  schedule: ReminderSchedule;
  onChange: (schedule: ReminderSchedule) => void;
  /** When set, shows a master Reminder switch and dims nested controls when off. */
  reminderEnabled?: boolean;
  onReminderEnabledChange?: (enabled: boolean) => void;
  radiusMeters?: ReminderRadiusMeters;
  onRadiusChange?: (radius: ReminderRadiusMeters) => void;
};

function defaultTimeDate(): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  return date;
}

function timeWithOffset(value: string, offsetMinutes: number): Date | undefined {
  const date = timeStringToDate(value);
  if (!date) {
    return undefined;
  }

  date.setMinutes(date.getMinutes() + offsetMinutes);
  return date;
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export default function ReminderScheduleFields({
  schedule,
  onChange,
  reminderEnabled = true,
  onReminderEnabledChange,
  radiusMeters,
  onRadiusChange,
}: ReminderScheduleFieldsProps) {
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [activePicker, setActivePicker] = useState<PickerKind | null>(null);
  const [pickerDate, setPickerDate] = useState(defaultTimeDate);
  const activePickerRef = useRef<PickerKind | null>(null);

  const showMasterToggle = typeof onReminderEnabledChange === 'function';
  const controlsActive = reminderEnabled;
  const dateMode = getScheduleDateMode(schedule);
  const activeDateMode: ScheduleDateMode =
    dateMode === 'weekly' ? 'weekly' : dateMode === 'once' ? 'once' : 'daily';

  const closePicker = () => {
    activePickerRef.current = null;
    setActivePicker(null);
  };

  const openPicker = (kind: PickerKind) => {
    if (!controlsActive) {
      return;
    }
    activePickerRef.current = kind;
    if (kind === 'date') {
      setPickerDate(
        schedule.date ? dateFromScheduleDate(schedule.date) ?? new Date() : new Date(),
      );
    } else if (kind === 'timeStart') {
      setPickerDate(timeStringToDate(schedule.timeStart ?? '09:00') ?? defaultTimeDate());
    } else {
      setPickerDate(timeStringToDate(schedule.timeEnd ?? '17:00') ?? defaultTimeDate());
    }
    setActivePicker(kind);
  };

  const applyPickerValue = (kind: PickerKind, selected: Date) => {
    if (kind === 'date') {
      onChange({
        ...schedule,
        date: formatDateFromDate(selected),
        repeat: undefined,
        weekdays: undefined,
      });
      return;
    }

    if (kind === 'timeStart') {
      onChange(
        clampScheduleTimeRange({
          ...schedule,
          timeStart: formatTimeFromDate(selected),
        }),
      );
      return;
    }

    onChange(
      clampScheduleTimeRange({
        ...schedule,
        timeEnd: formatTimeFromDate(selected),
      }),
    );
  };

  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    const kind = activePickerRef.current;
    if (!kind) {
      return;
    }

    if (Platform.OS === 'android') {
      closePicker();
      if (event.type === 'dismissed' || !selected) {
        return;
      }
      applyPickerValue(kind, selected);
      return;
    }

    if (!selected) {
      return;
    }

    setPickerDate(selected);
    applyPickerValue(kind, selected);
  };

  const handleReminderToggle = () => {
    if (!onReminderEnabledChange) {
      return;
    }
    animateLayout();
    const next = !reminderEnabled;
    if (next) {
      const seeded: ReminderSchedule = { ...schedule };
      if (getScheduleDateMode(seeded) === 'none') {
        seeded.repeat = 'daily';
        delete seeded.date;
        delete seeded.weekdays;
      }
      if (!seeded.timeStart && !seeded.timeEnd) {
        seeded.timeStart = '09:00';
      }
      onChange(clampScheduleTimeRange(seeded));
    }
    onReminderEnabledChange(next);
  };

  const setDateMode = (mode: ScheduleDateMode) => {
    if (!controlsActive) {
      return;
    }
    animateLayout();
    if (mode === 'daily') {
      onChange({
        ...schedule,
        repeat: 'daily',
        date: undefined,
        weekdays: undefined,
      });
      return;
    }

    if (mode === 'weekly') {
      onChange({
        ...schedule,
        weekdays: schedule.weekdays?.length ? schedule.weekdays : [new Date().getDay()],
        date: undefined,
        repeat: undefined,
      });
      return;
    }

    onChange({
      ...schedule,
      date: schedule.date ?? formatDateFromDate(new Date()),
      repeat: undefined,
      weekdays: undefined,
    });
  };

  const toggleWeekday = (day: number) => {
    if (!controlsActive) {
      return;
    }
    const selected = new Set(schedule.weekdays ?? []);
    if (selected.has(day)) {
      if (selected.size === 1) {
        return;
      }
      selected.delete(day);
    } else {
      selected.add(day);
    }

    onChange({
      ...schedule,
      weekdays: [...selected].sort((left, right) => left - right),
      date: undefined,
      repeat: undefined,
    });
  };

  const clearTimeEnd = () => {
    if (!controlsActive || !schedule.timeEnd) {
      return;
    }
    const next = { ...schedule };
    delete next.timeEnd;
    onChange(next);
  };

  const clearTimeStart = () => {
    if (!controlsActive || !schedule.timeStart) {
      return;
    }
    const next = { ...schedule };
    delete next.timeStart;
    onChange(next);
  };

  return (
    <View style={styles.container}>
      {showMasterToggle ? (
        <View style={styles.headerRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.sectionLabel}>{t.reminderSection}</Text>
            <Text style={styles.toggleHint}>{t.reminderNearHint}</Text>
          </View>
          <Toggle
            enabled={reminderEnabled}
            onToggle={handleReminderToggle}
            accessibilityLabel={t.reminderSection}
          />
        </View>
      ) : (
        <Text style={styles.sectionLabel}>{t.reminderSection}</Text>
      )}

      <View
        style={[styles.controls, !controlsActive && styles.controlsInactive]}
        pointerEvents={controlsActive ? 'auto' : 'none'}
        accessibilityElementsHidden={!controlsActive}
        importantForAccessibility={controlsActive ? 'yes' : 'no-hide-descendants'}
      >
        <View style={styles.block}>
          <Text style={styles.blockLabel}>{t.daysLabel}</Text>
          <View style={styles.dateModeRow}>
            {(
              [
                { mode: 'once' as const, label: t.oneDay },
                { mode: 'daily' as const, label: t.everyDay },
                { mode: 'weekly' as const, label: t.customDays },
              ] as const
            ).map(({ mode, label }) => {
              const selected = activeDateMode === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: !controlsActive }}
                  accessibilityLabel={label}
                  style={({ pressed }) => [
                    styles.dateModeOption,
                    selected && styles.dateModeOptionSelected,
                    pressed && controlsActive && styles.pressedSoft,
                  ]}
                  onPress={() => setDateMode(mode)}
                >
                  <Text
                    style={[
                      styles.dateModeOptionLabel,
                      selected && styles.dateModeOptionLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeDateMode === 'once' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.reminderDateLabel}
              style={({ pressed }) => [styles.dateField, pressed && styles.pressedSoft]}
              onPress={() => openPicker('date')}
            >
              <View style={styles.valueRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                <Text style={styles.valueText}>
                  {formatScheduleDateLabel(schedule.date, language, t.notSet)}
                </Text>
              </View>
            </Pressable>
          ) : null}

          {activeDateMode === 'weekly' ? (
            <View style={styles.weekdayRow}>
              {WEEKDAY_OPTIONS.map((day) => {
                const selected = schedule.weekdays?.includes(day) ?? false;
                const label = formatWeekdayLabel(day, language);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: !controlsActive }}
                    accessibilityLabel={label}
                    style={({ pressed }) => [
                      styles.weekdayChip,
                      selected && styles.weekdayChipSelected,
                      pressed && controlsActive && styles.pressedSoft,
                    ]}
                    onPress={() => toggleWeekday(day)}
                  >
                    <Text
                      style={[
                        styles.weekdayChipLabel,
                        selected && styles.weekdayChipLabelSelected,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>{t.timeLabel}</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeFieldLabel}>{t.timeFrom}</Text>
              <View style={styles.valueRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t.timeFrom}, ${
                    schedule.timeStart
                      ? formatScheduleTimeLabel(schedule.timeStart, language)
                      : t.anytime
                  }`}
                  style={({ pressed }) => [styles.timeValuePressable, pressed && styles.pressedSoft]}
                  onPress={() => openPicker('timeStart')}
                >
                  <Ionicons name="time-outline" size={16} color={colors.accent} />
                  <Text style={styles.valueText} numberOfLines={1}>
                    {schedule.timeStart
                      ? formatScheduleTimeLabel(schedule.timeStart, language)
                      : t.anytime}
                  </Text>
                </Pressable>
                {schedule.timeStart ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.clearTimeA11y}
                    hitSlop={8}
                    onPress={clearTimeStart}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.slate300} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.timeArrow} accessibilityElementsHidden>
              <Ionicons name="arrow-forward" size={14} color={colors.slate300} />
            </View>

            <View style={styles.timeField}>
              <Text style={styles.timeFieldLabel}>{t.timeTo}</Text>
              <View style={styles.valueRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t.timeTo}, ${
                    schedule.timeEnd
                      ? formatScheduleTimeLabel(schedule.timeEnd, language)
                      : t.anytime
                  }`}
                  style={({ pressed }) => [styles.timeValuePressable, pressed && styles.pressedSoft]}
                  onPress={() => openPicker('timeEnd')}
                >
                  <Ionicons name="time-outline" size={16} color={colors.accent} />
                  <Text style={styles.valueText} numberOfLines={1}>
                    {schedule.timeEnd
                      ? formatScheduleTimeLabel(schedule.timeEnd, language)
                      : t.anytime}
                  </Text>
                </Pressable>
                {schedule.timeEnd ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.clearTimeA11y}
                    hitSlop={8}
                    onPress={clearTimeEnd}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.slate300} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {radiusMeters != null && onRadiusChange ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>{t.reminderDistance}</Text>
            <View style={styles.rangeRow}>
              {REMINDER_RADIUS_OPTIONS.map((option) => {
                const selected = radiusMeters === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: !controlsActive }}
                    accessibilityLabel={fill(t.metersUnit, { meters: option })}
                    style={({ pressed }) => [
                      styles.rangeOption,
                      selected && styles.rangeOptionSelected,
                      pressed && controlsActive && styles.pressedSoft,
                    ]}
                    onPress={() => onRadiusChange(option)}
                  >
                    <Text
                      style={[styles.rangeOptionLabel, selected && styles.rangeOptionLabelSelected]}
                    >
                      {fill(t.metersUnit, { meters: option })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.rangeHint}>
              {fill(t.remindWithinShort, { meters: radiusMeters })}
            </Text>
          </View>
        ) : null}
      </View>

      {activePicker && controlsActive ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode={activePicker === 'date' ? 'date' : 'time'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={
              activePicker === 'date'
                ? new Date()
                : activePicker === 'timeEnd' && schedule.timeStart
                  ? timeWithOffset(schedule.timeStart, 1)
                  : undefined
            }
            maximumDate={
              activePicker === 'timeStart' && schedule.timeEnd
                ? timeWithOffset(schedule.timeEnd, -1)
                : undefined
            }
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={({ pressed }) => [styles.pickerDoneBtn, pressed && styles.pressedSoft]}
              onPress={closePicker}
              accessibilityRole="button"
              accessibilityLabel={t.done}
            >
              <Text style={styles.pickerDoneLabel}>{t.done}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 4,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  toggleHint: {
    fontSize: 12,
    color: colors.slate400,
    lineHeight: 16,
  },
  controls: {
    gap: spacing.md,
  },
  controlsInactive: {
    opacity: 0.4,
  },
  block: {
    gap: spacing.sm,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  dateModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateModeOption: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  dateModeOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
    textAlign: 'center',
  },
  dateModeOptionLabelSelected: {
    color: colors.accent,
  },
  dateField: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekdayChip: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  weekdayChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  weekdayChipLabelSelected: {
    color: colors.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeArrow: {
    paddingHorizontal: 2,
  },
  timeField: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
    minHeight: 64,
  },
  timeValuePressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  timeFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  valueText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
  },
  clearBtn: {
    marginLeft: 'auto',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeOption: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rangeOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate500,
  },
  rangeOptionLabelSelected: {
    color: colors.accent,
  },
  rangeHint: {
    fontSize: 12,
    color: colors.slate400,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
  pressedSoft: {
    opacity: 0.85,
  },
  pickerWrap: {
    gap: spacing.sm,
  },
  pickerDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
  },
  pickerDoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
}));
