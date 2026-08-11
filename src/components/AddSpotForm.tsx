import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import {
  DEFAULT_REMINDER_RADIUS_METERS,
  MAX_DESCRIPTION_LENGTH,
  type ReminderRadiusMeters,
  type ReminderSchedule,
} from '../types/reminder';
import { normalizeSchedule } from '../utils/reminderSchedule';

import type { PickedLocation } from './MapPickerScreen';
import ReminderScheduleFields from './ReminderScheduleFields';

type AddSpotFormProps = {
  location: PickedLocation;
  onConfirm: (
    title: string,
    description: string,
    radiusMeters: ReminderRadiusMeters,
    schedule: ReminderSchedule | undefined,
    enabled: boolean,
  ) => void;
  onDiscard: () => void;
  onEditLocation?: () => void;
};

export default function AddSpotForm({
  location,
  onConfirm,
  onDiscard,
  onEditLocation,
}: AddSpotFormProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [radiusMeters, setRadiusMeters] = useState<ReminderRadiusMeters>(
    DEFAULT_REMINDER_RADIUS_METERS,
  );
  const [schedule, setSchedule] = useState<ReminderSchedule>({
    repeat: 'daily',
    timeStart: '09:00',
  });

  const isValid = title.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={16} color={colors.accent} />
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationLabel}>{t.selectedLocation}</Text>
              {onEditLocation ? (
                <Pressable
                  onPress={onEditLocation}
                  accessibilityRole="button"
                  accessibilityLabel={t.edit}
                  hitSlop={8}
                  style={({ pressed }) => [styles.editLocationBtn, pressed && styles.pressedSoft]}
                >
                  <Text style={styles.editLocationLabel}>{t.edit}</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.locationValue}>{location.address}</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t.fieldTitle}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.titlePlaceholder}
            placeholderTextColor={colors.slate300}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoFocus
            accessibilityLabel={t.fieldTitle}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.descHeader}>
            <Text style={styles.fieldLabel}>
              {t.fieldDescription} <Text style={styles.optional}>{t.optional}</Text>
            </Text>
            <Text style={styles.counter}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              descriptionFocused && styles.textAreaFocused,
            ]}
            placeholder={t.descriptionPlaceholder}
            placeholderTextColor={colors.slate300}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
            multiline
            numberOfLines={descriptionFocused ? 3 : 1}
            textAlignVertical="top"
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            accessibilityLabel={t.fieldDescription}
          />
        </View>

        <ReminderScheduleFields
          schedule={schedule}
          onChange={setSchedule}
          reminderEnabled={reminderEnabled}
          onReminderEnabledChange={setReminderEnabled}
          radiusMeters={radiusMeters}
          onRadiusChange={setRadiusMeters}
        />
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.discardBtn, pressed && styles.discardBtnPressed]}
          onPress={onDiscard}
          accessibilityRole="button"
          accessibilityLabel={t.discard}
        >
          <Text style={styles.discardLabel}>{t.discard}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            isValid ? styles.confirmBtnActive : styles.confirmBtnDisabled,
            pressed && isValid && styles.confirmBtnPressed,
          ]}
          onPress={() =>
            isValid &&
            onConfirm(
              title.trim(),
              description.trim(),
              radiusMeters,
              normalizeSchedule(schedule),
              reminderEnabled,
            )
          }
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isValid }}
          accessibilityLabel={t.confirm}
        >
          <Text style={[styles.confirmLabel, !isValid && styles.confirmLabelDisabled]}>
            {t.confirm}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locationInfo: {
    flex: 1,
    minWidth: 0,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  locationLabel: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  editLocationBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  editLocationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    opacity: 0.85,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 2,
  },
  field: {
    gap: 6,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate500,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  optional: {
    textTransform: 'none',
    fontWeight: '400',
    color: colors.slate300,
  },
  counter: {
    fontSize: 11,
    color: colors.slate300,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.slate800,
  },
  textArea: {
    minHeight: 48,
    maxHeight: 48,
    paddingTop: 14,
  },
  textAreaFocused: {
    minHeight: 88,
    maxHeight: 120,
  },
  pressedSoft: {
    opacity: 0.75,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  discardBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  discardBtnPressed: {
    backgroundColor: colors.slate50,
  },
  discardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate500,
  },
  confirmBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.slate100,
  },
  confirmBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  confirmLabelDisabled: {
    color: colors.slate300,
  },
}));
