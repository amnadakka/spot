import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { useI18n } from '../i18n/I18nContext';
import { fill, localeTag } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import {
  MAX_DESCRIPTION_LENGTH,
  type Reminder,
  type ReminderSchedule,
} from '../types/reminder';
import { formatAddressDisplayLines, formatShortLocationSummary } from '../utils/formatAddress';
import { formatLocalDateTime } from '../utils/formatLocalDateTime';
import {
  formatSpotDetailReminderSummary,
  normalizeSchedule,
} from '../utils/reminderSchedule';

import ReminderScheduleFields from './ReminderScheduleFields';
import ConfirmDialog from './ui/ConfirmDialog';

type SpotDetailScreenProps = {
  reminder: Reminder;
  /** When opened from history, the local time the geofence notification fired. */
  triggeredAt?: string;
  /** When false, editing is disabled (e.g. history snapshot for a deleted spot). */
  allowEdit?: boolean;
  onUpdate?: (
    reminderId: string,
    updates: { description?: string; schedule?: ReminderSchedule },
  ) => void;
  onDelete?: (reminderId: string) => void;
};

const MAP_DELTA = 0.008;
/** ~18% shorter than the previous 260px hero map. */
const MAP_HEIGHT = 212;

export default function SpotDetailScreen({
  reminder,
  triggeredAt,
  allowEdit = true,
  onUpdate,
  onDelete,
}: SpotDetailScreenProps) {
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(reminder.description ?? '');
  const [schedule, setSchedule] = useState<ReminderSchedule>(reminder.schedule ?? {});
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    setDescription(reminder.description ?? '');
    setSchedule(reminder.schedule ?? {});
    setEditing(false);
  }, [reminder.id]);

  const savedScheduleKey = [
    reminder.schedule?.date ?? '',
    reminder.schedule?.repeat ?? '',
    (reminder.schedule?.weekdays ?? []).join(','),
    reminder.schedule?.timeStart ?? '',
    reminder.schedule?.timeEnd ?? '',
  ].join('|');

  useEffect(() => {
    if (editing) {
      return;
    }

    setDescription(reminder.description ?? '');
    setSchedule(reminder.schedule ?? {});
  }, [editing, reminder.description, savedScheduleKey, reminder.schedule]);

  const region: Region = {
    latitude: reminder.latitude,
    longitude: reminder.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };

  const canEdit = Boolean(onUpdate) && allowEdit;
  const canDelete = Boolean(onDelete) && allowEdit;
  const shortLocation = formatShortLocationSummary(reminder.address);
  const addressLines = formatAddressDisplayLines(reminder.address);
  const reminderSummary = formatSpotDetailReminderSummary(
    reminder.enabled,
    reminder.schedule,
    language,
  );
  const statusLabel = reminder.enabled ? t.statusActive : t.statusPaused;

  const handleSave = () => {
    onUpdate?.(reminder.id, {
      description: description.trim() || undefined,
      schedule: normalizeSchedule(schedule),
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setDescription(reminder.description ?? '');
    setSchedule(reminder.schedule ?? {});
    setEditing(false);
  };

  const handleDelete = () => {
    if (!onDelete) {
      return;
    }
    setDeleteConfirmVisible(true);
  };

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onMapReady={() => setMapReady(true)}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation
          showsMyLocationButton={false}
          accessibilityLabel={fill(t.radiusLabel, { meters: reminder.radiusMeters })}
        >
          {mapReady ? (
            <>
              <Marker
                coordinate={{
                  latitude: reminder.latitude,
                  longitude: reminder.longitude,
                }}
                pinColor={colors.primary}
              />
              <Circle
                center={{
                  latitude: reminder.latitude,
                  longitude: reminder.longitude,
                }}
                radius={reminder.radiusMeters}
                fillColor="rgba(59, 130, 246, 0.12)"
                strokeColor="rgba(59, 130, 246, 0.4)"
                strokeWidth={1.5}
              />
            </>
          ) : null}
        </MapView>

        <View style={styles.radiusBadge} accessibilityElementsHidden>
          <Ionicons name="resize-outline" size={12} color={colors.accent} />
          <Text style={styles.radiusText}>
            {fill(t.radiusLabel, { meters: reminder.radiusMeters })}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View
            style={styles.statusRow}
            accessibilityRole="text"
            accessibilityLabel={statusLabel}
          >
            <View
              style={[
                styles.statusDot,
                reminder.enabled ? styles.statusActive : styles.statusInactive,
              ]}
            />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>

          {editing && canEdit ? (
            <View style={styles.editActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.editActionBtn,
                  pressed && styles.editActionBtnPressed,
                ]}
                onPress={handleCancelEdit}
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
              >
                <Text style={styles.editActionCancel}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.editActionBtn,
                  styles.editActionBtnPrimary,
                  pressed && styles.editActionBtnPrimaryPressed,
                ]}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel={t.save}
              >
                <Text style={styles.editActionSave}>{t.save}</Text>
              </Pressable>
            </View>
          ) : canEdit || canDelete ? (
            <View style={styles.headerActions}>
              {canDelete ? (
                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
                  onPress={handleDelete}
                  accessibilityRole="button"
                  accessibilityLabel={t.delete}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  <Text style={styles.deleteBtnLabel}>{t.delete}</Text>
                </Pressable>
              ) : null}
              {canEdit ? (
                <Pressable
                  style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                  onPress={() => setEditing(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t.edit}
                >
                  <Ionicons name="create-outline" size={16} color={colors.accent} />
                  <Text style={styles.editBtnLabel}>{t.edit}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {reminder.title}
        </Text>
        {shortLocation ? (
          <Text style={styles.locationSubtitle} numberOfLines={2}>
            {shortLocation}
          </Text>
        ) : null}

        <View style={styles.divider} />

        {editing ? (
          <>
            <View style={styles.field}>
              <View style={styles.descHeader}>
                <Text style={styles.infoLabel}>{t.descriptionLabel}</Text>
                <Text style={styles.counter}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t.descriptionPlaceholderShort}
                placeholderTextColor={colors.slate300}
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel={t.descriptionLabel}
              />
            </View>

            <View style={styles.field}>
              <ReminderScheduleFields
                key={reminder.id}
                schedule={schedule}
                onChange={setSchedule}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{t.descriptionLabel}</Text>
                <Text style={[styles.infoValue, !reminder.description && styles.infoValueMuted]}>
                  {reminder.description?.trim() || t.noDescription}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons
                  name={reminder.enabled ? 'time-outline' : 'notifications-off-outline'}
                  size={16}
                  color={colors.accent}
                />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>{reminderSummary.label}</Text>
                <Text
                  style={[styles.infoValue, reminderSummary.muted && styles.infoValueMuted]}
                  accessibilityLabel={`${reminderSummary.label}: ${reminderSummary.value}`}
                >
                  {reminderSummary.value}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="location" size={16} color={colors.accent} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>{t.locationLabel}</Text>
            <Text style={styles.infoValue}>
              {addressLines.map((line, index) => (
                <Text key={`${line}-${index}`}>
                  {index > 0 ? '\n' : ''}
                  {line}
                </Text>
              ))}
            </Text>
          </View>
        </View>

        {triggeredAt ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="notifications-outline" size={16} color={colors.accent} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>{t.triggeredLabel}</Text>
              <Text style={styles.infoValue}>{formatLocalDateTime(triggeredAt, language)}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.infoRow, styles.infoRowSecondary]}>
            <View style={[styles.infoIconWrap, styles.infoIconWrapSecondary]}>
              <Ionicons name="calendar-outline" size={16} color={colors.slate400} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoLabel, styles.infoLabelSecondary]}>{t.createdLabel}</Text>
              <Text style={[styles.infoValue, styles.infoValueSecondary]}>
                {new Date(reminder.createdAt).toLocaleDateString(localeTag(language), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.openMapsBtn, pressed && styles.openMapsBtnPressed]}
        onPress={() => {
          const url =
            Platform.OS === 'ios'
              ? `maps:0,0?q=${reminder.latitude},${reminder.longitude}`
              : `geo:${reminder.latitude},${reminder.longitude}?q=${reminder.latitude},${reminder.longitude}(${encodeURIComponent(reminder.title)})`;
          void import('react-native').then(({ Linking }) => Linking.openURL(url));
        }}
        accessibilityRole="button"
        accessibilityLabel={t.openInMaps}
      >
        <Ionicons name="open-outline" size={16} color={colors.accent} />
        <Text style={styles.openMapsLabel}>{t.openInMaps}</Text>
      </Pressable>
    </ScrollView>

    <ConfirmDialog
      visible={deleteConfirmVisible}
      title={t.deleteSpotsTitle}
      message={t.deleteSpotConfirmOne}
      cancelLabel={t.cancel}
      confirmLabel={t.delete}
      onCancel={() => setDeleteConfirmVisible(false)}
      onConfirm={() => {
        setDeleteConfirmVisible(false);
        onDelete?.(reminder.id);
      }}
    />
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  radiusBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  radiusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.slate300,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  editBtnPressed: {
    opacity: 0.85,
  },
  editBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: radii.md,
    backgroundColor: colors.slate100,
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.destructive,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minHeight: 32,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  editActionBtnPressed: {
    opacity: 0.85,
  },
  editActionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  editActionBtnPrimaryPressed: {
    backgroundColor: colors.primaryDark,
  },
  editActionCancel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  editActionSave: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  locationSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate500,
    marginTop: 4,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  field: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: 11,
    color: colors.slate300,
  },
  input: {
    backgroundColor: colors.background,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoRowSecondary: {
    marginBottom: 0,
    opacity: 0.9,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoIconWrapSecondary: {
    backgroundColor: colors.slate100,
  },
  infoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoLabelSecondary: {
    color: colors.slate300,
  },
  infoValue: {
    fontSize: 14,
    color: colors.slate700,
    marginTop: 2,
    lineHeight: 20,
  },
  infoValueMuted: {
    color: colors.slate400,
    fontStyle: 'italic',
  },
  infoValueSecondary: {
    color: colors.slate500,
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: 14,
    minHeight: 48,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  openMapsBtnPressed: {
    backgroundColor: colors.slate50,
  },
  openMapsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
}));
