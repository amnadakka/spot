import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import type { ReminderSchedule } from '../types/reminder';
import {
  dateFromScheduleDate,
  formatDateFromDate,
  formatScheduleDateLabel,
  formatScheduleTimeLabel,
  formatTimeFromDate,
  timeStringToDate,
} from '../utils/reminderSchedule';

type PickerKind = 'date' | 'timeStart' | 'timeEnd';

type ReminderScheduleFieldsProps = {
  schedule: ReminderSchedule;
  onChange: (schedule: ReminderSchedule) => void;
};

function defaultTimeDate(): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  return date;
}

export default function ReminderScheduleFields({
  schedule,
  onChange,
}: ReminderScheduleFieldsProps) {
  const [timeEnabled, setTimeEnabled] = useState(
    Boolean(schedule.timeStart || schedule.timeEnd),
  );
  const [dateEnabled, setDateEnabled] = useState(Boolean(schedule.date));
  const [activePicker, setActivePicker] = useState<PickerKind | null>(null);
  const [pickerDate, setPickerDate] = useState(defaultTimeDate);

  const openPicker = (kind: PickerKind) => {
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

  const handlePickerChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (!selected || !activePicker) {
      return;
    }

    if (activePicker === 'date') {
      onChange({ ...schedule, date: formatDateFromDate(selected) });
      return;
    }

    if (activePicker === 'timeStart') {
      onChange({ ...schedule, timeStart: formatTimeFromDate(selected) });
      return;
    }

    onChange({ ...schedule, timeEnd: formatTimeFromDate(selected) });
  };

  const toggleTimeEnabled = () => {
    if (timeEnabled) {
      const next = { ...schedule };
      delete next.timeStart;
      delete next.timeEnd;
      onChange(next);
      setTimeEnabled(false);
      return;
    }

    setTimeEnabled(true);
    onChange({
      ...schedule,
      timeStart: schedule.timeStart ?? '09:00',
    });
  };

  const toggleDateEnabled = () => {
    if (dateEnabled) {
      const next = { ...schedule };
      delete next.date;
      onChange(next);
      setDateEnabled(false);
      return;
    }

    setDateEnabled(true);
    onChange({
      ...schedule,
      date: schedule.date ?? formatDateFromDate(new Date()),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.toggleRow, pressed && styles.toggleRowPressed]}
          onPress={toggleTimeEnabled}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.fieldLabel}>
              REMINDER TIME <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Text style={styles.toggleHint}>
              Get reminded at an exact time, optionally between two times.
            </Text>
          </View>
          <View style={[styles.toggleChip, timeEnabled && styles.toggleChipActive]}>
            <Text style={[styles.toggleChipLabel, timeEnabled && styles.toggleChipLabelActive]}>
              {timeEnabled ? 'On' : 'Off'}
            </Text>
          </View>
        </Pressable>

        {timeEnabled ? (
          <View style={styles.timeRow}>
            <Pressable
              style={({ pressed }) => [styles.timeField, pressed && styles.timeFieldPressed]}
              onPress={() => openPicker('timeStart')}
            >
              <Text style={styles.timeFieldLabel}>From</Text>
              <View style={styles.timeFieldValueRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.timeFieldValue}>
                  {formatScheduleTimeLabel(schedule.timeStart)}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.timeField, pressed && styles.timeFieldPressed]}
              onPress={() => openPicker('timeEnd')}
            >
              <Text style={styles.timeFieldLabel}>To</Text>
              <View style={styles.timeFieldValueRow}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.timeFieldValue}>
                  {schedule.timeEnd ? formatScheduleTimeLabel(schedule.timeEnd) : 'Optional'}
                </Text>
              </View>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.toggleRow, pressed && styles.toggleRowPressed]}
          onPress={toggleDateEnabled}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.fieldLabel}>
              REMINDER DATE <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Text style={styles.toggleHint}>Limit the reminder to a specific day.</Text>
          </View>
          <View style={[styles.toggleChip, dateEnabled && styles.toggleChipActive]}>
            <Text style={[styles.toggleChipLabel, dateEnabled && styles.toggleChipLabelActive]}>
              {dateEnabled ? 'On' : 'Off'}
            </Text>
          </View>
        </Pressable>

        {dateEnabled ? (
          <Pressable
            style={({ pressed }) => [styles.dateField, pressed && styles.timeFieldPressed]}
            onPress={() => openPicker('date')}
          >
            <View style={styles.timeFieldValueRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.timeFieldValue}>
                {formatScheduleDateLabel(schedule.date)}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {activePicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerDate}
            mode={activePicker === 'date' ? 'date' : 'time'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={activePicker === 'date' ? new Date() : undefined}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={({ pressed }) => [styles.pickerDoneBtn, pressed && styles.timeFieldPressed]}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.pickerDoneLabel}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 4,
  },
  toggleRowPressed: {
    opacity: 0.85,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    letterSpacing: 0.5,
  },
  optional: {
    textTransform: 'none',
    fontWeight: '400',
    color: colors.slate300,
  },
  toggleHint: {
    fontSize: 12,
    color: colors.slate400,
    lineHeight: 16,
  },
  toggleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.lg,
    backgroundColor: colors.slate100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  toggleChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  toggleChipLabelActive: {
    color: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  },
  dateField: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  timeFieldPressed: {
    backgroundColor: colors.slate50,
  },
  timeFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeFieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
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
    color: colors.primary,
  },
});
