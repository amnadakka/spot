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

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import {
  MAX_DESCRIPTION_LENGTH,
  type Reminder,
  type ReminderSchedule,
} from '../types/reminder';
import { formatLocalDateTime } from '../utils/formatLocalDateTime';
import {
  formatScheduleDateLabel,
  formatScheduleTimeLabel,
  hasScheduleTiming,
  normalizeSchedule,
} from '../utils/reminderSchedule';

import ReminderScheduleFields from './ReminderScheduleFields';

type SpotDetailScreenProps = {
  reminder: Reminder;
  /** When opened from history, the local time the geofence notification fired. */
  triggeredAt?: string;
  onUpdate?: (
    reminderId: string,
    updates: { description?: string; schedule?: ReminderSchedule },
  ) => void;
};

const MAP_DELTA = 0.008;

export default function SpotDetailScreen({
  reminder,
  triggeredAt,
  onUpdate,
}: SpotDetailScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(reminder.description ?? '');
  const [schedule, setSchedule] = useState<ReminderSchedule>(reminder.schedule ?? {});

  useEffect(() => {
    setDescription(reminder.description ?? '');
    setSchedule(reminder.schedule ?? {});
    setEditing(false);
  }, [reminder.id, reminder.description, reminder.schedule]);

  const region: Region = {
    latitude: reminder.latitude,
    longitude: reminder.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };

  const canEdit = Boolean(onUpdate) && !triggeredAt;

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

  return (
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

        <View style={styles.radiusBadge}>
          <Ionicons name="resize-outline" size={12} color={colors.primary} />
          <Text style={styles.radiusText}>{reminder.radiusMeters}m radius</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, reminder.enabled ? styles.statusActive : styles.statusInactive]}
            />
            <Text style={styles.statusLabel}>{reminder.enabled ? 'Active' : 'Paused'}</Text>
          </View>

          {canEdit ? (
            editing ? (
              <View style={styles.editActions}>
                <Pressable
                  style={({ pressed }) => [styles.editActionBtn, pressed && styles.editActionBtnPressed]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.editActionCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.editActionBtn,
                    styles.editActionBtnPrimary,
                    pressed && styles.editActionBtnPrimaryPressed,
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.editActionSave}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && styles.editBtnPressed]}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.editBtnLabel}>Edit</Text>
              </Pressable>
            )
          ) : null}
        </View>

        <Text style={styles.title}>{reminder.title}</Text>

        <View style={styles.divider} />

        {editing ? (
          <>
            <View style={styles.field}>
              <View style={styles.descHeader}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.counter}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add an optional description…"
                placeholderTextColor={colors.slate300}
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.infoLabel}>Reminder schedule</Text>
              <ReminderScheduleFields schedule={schedule} onChange={setSchedule} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={[styles.infoValue, !reminder.description && styles.infoValueMuted]}>
                  {reminder.description?.trim() || 'No description'}
                </Text>
              </View>
            </View>

            {hasScheduleTiming(reminder.schedule) ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>Reminder time</Text>
                    <Text style={styles.infoValue}>
                      {reminder.schedule?.timeStart && reminder.schedule?.timeEnd
                        ? `Between ${formatScheduleTimeLabel(reminder.schedule.timeStart)} and ${formatScheduleTimeLabel(reminder.schedule.timeEnd)}`
                        : reminder.schedule?.timeStart
                          ? `At ${formatScheduleTimeLabel(reminder.schedule.timeStart)}`
                          : reminder.schedule?.timeEnd
                            ? `Until ${formatScheduleTimeLabel(reminder.schedule.timeEnd)}`
                            : 'Not set'}
                    </Text>
                  </View>
                </View>

                {reminder.schedule?.date ? (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconWrap}>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>Reminder date</Text>
                      <Text style={styles.infoValue}>
                        {formatScheduleDateLabel(reminder.schedule.date)}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Reminder schedule</Text>
                  <Text style={[styles.infoValue, styles.infoValueMuted]}>Any time</Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{reminder.address}</Text>
          </View>
        </View>

        {triggeredAt ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="notifications-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Triggered</Text>
              <Text style={styles.infoValue}>{formatLocalDateTime(triggeredAt)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(reminder.createdAt).toLocaleDateString(undefined, {
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
      >
        <Ionicons name="open-outline" size={16} color={colors.primary} />
        <Text style={styles.openMapsLabel}>Open in Maps</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  mapContainer: {
    height: 260,
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
    color: colors.primary,
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
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
  },
  editBtnPressed: {
    opacity: 0.85,
  },
  editBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.md,
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
    color: colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
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
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: 14,
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
    color: colors.primary,
  },
});
