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

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import {
  DEFAULT_REMINDER_RADIUS_METERS,
  MAX_DESCRIPTION_LENGTH,
  REMINDER_RADIUS_OPTIONS,
  type ReminderRadiusMeters,
} from '../types/reminder';

import type { PickedLocation } from './MapPickerScreen';

type AddSpotFormProps = {
  location: PickedLocation;
  onConfirm: (title: string, description: string, radiusMeters: ReminderRadiusMeters) => void;
  onDiscard: () => void;
};

export default function AddSpotForm({ location, onConfirm, onDiscard }: AddSpotFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [radiusMeters, setRadiusMeters] = useState<ReminderRadiusMeters>(
    DEFAULT_REMINDER_RADIUS_METERS,
  );

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
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>SELECTED LOCATION</Text>
            <Text style={styles.locationValue} numberOfLines={2}>
              {location.address}
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Secret Lookout"
            placeholderTextColor={colors.slate300}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>REMINDER RANGE</Text>
          <View style={styles.rangeRow}>
            {REMINDER_RADIUS_OPTIONS.map((option) => {
              const selected = radiusMeters === option;
              return (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.rangeOption,
                    selected && styles.rangeOptionSelected,
                    pressed && styles.rangeOptionPressed,
                  ]}
                  onPress={() => setRadiusMeters(option)}
                >
                  <Text style={[styles.rangeOptionLabel, selected && styles.rangeOptionLabelSelected]}>
                    {option} m
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.rangeHint}>
            You'll be reminded when you're within {radiusMeters} meters of this spot.
          </Text>
        </View>

        <View style={styles.field}>
          <View style={styles.descHeader}>
            <Text style={styles.fieldLabel}>
              DESCRIPTION <Text style={styles.optional}>(optional)</Text>
            </Text>
            <Text style={styles.counter}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add an optional description (e.g., best at sunset)…"
            placeholderTextColor={colors.slate300}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.discardBtn, pressed && styles.discardBtnPressed]}
          onPress={onDiscard}
        >
          <Text style={styles.discardLabel}>Discard</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            isValid ? styles.confirmBtnActive : styles.confirmBtnDisabled,
            pressed && isValid && styles.confirmBtnPressed,
          ]}
          onPress={() => isValid && onConfirm(title.trim(), description.trim(), radiusMeters)}
          disabled={!isValid}
        >
          <Text style={[styles.confirmLabel, !isValid && styles.confirmLabelDisabled]}>
            Confirm
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
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
  },
  locationInfo: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.5,
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
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  rangeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  rangeOptionPressed: {
    opacity: 0.85,
  },
  rangeOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate500,
  },
  rangeOptionLabelSelected: {
    color: colors.primary,
  },
  rangeHint: {
    fontSize: 12,
    color: colors.slate400,
    paddingHorizontal: 4,
    lineHeight: 16,
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
    minHeight: 96,
    paddingTop: 14,
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
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    alignItems: 'center',
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
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
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
    color: colors.surface,
  },
  confirmLabelDisabled: {
    color: colors.slate300,
  },
});
