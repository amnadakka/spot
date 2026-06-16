import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import { configureAlarmAudioMode } from '../audio/configureAlarmAudio';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

export type ActiveGeofenceSpot = {
  regionId: string;
  title: string;
  subtitle: string;
};

export type ActiveGeofenceAlarm = {
  spots: ActiveGeofenceSpot[];
  startedAt: number;
};

type GeofenceAlarmRingingLayerProps = {
  alarm: ActiveGeofenceAlarm;
  onDismiss: () => void;
  onViewSpot: (regionId: string) => void;
};

export default function GeofenceAlarmRingingLayer({
  alarm,
  onDismiss,
  onViewSpot,
}: GeofenceAlarmRingingLayerProps) {
  const player = useAudioPlayer(require('../../assets/alarm_ringtone.wav'));
  const spotCount = alarm.spots.length;
  const isGrouped = spotCount > 1;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await configureAlarmAudioMode();
      if (cancelled) {
        return;
      }

      player.loop = true;
      player.play();
    })();

    return () => {
      cancelled = true;
      player.pause();
    };
  }, [player]);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="alarm" size={48} color={colors.primary} />
          </View>
          <Text style={styles.eyebrow}>Spot alarm</Text>
          <Text style={styles.title}>
            {isGrouped ? `You're near ${spotCount} spots` : alarm.spots[0]?.title ?? 'Spot Alarm'}
          </Text>
          <Text style={styles.subtitle}>
            {isGrouped
              ? 'Tap a spot for details, or dismiss to stop the alarm.'
              : alarm.spots[0]?.subtitle ?? 'You entered a saved spot area.'}
          </Text>
        </View>

        {isGrouped ? (
          <ScrollView style={styles.spotList} contentContainerStyle={styles.spotListContent}>
            {alarm.spots.map((spot) => (
              <Pressable
                key={spot.regionId}
                accessibilityRole="button"
                accessibilityLabel={`View ${spot.title}`}
                onPress={() => onViewSpot(spot.regionId)}
                style={({ pressed }) => [styles.spotRow, pressed && styles.spotRowPressed]}
              >
                <View style={styles.spotRowIcon}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <View style={styles.spotRowText}>
                  <Text style={styles.spotRowTitle} numberOfLines={1}>
                    {spot.title}
                  </Text>
                  <Text style={styles.spotRowSubtitle} numberOfLines={2}>
                    {spot.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actions}>
          {!isGrouped ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View spot details"
              onPress={() => onViewSpot(alarm.spots[0].regionId)}
              style={({ pressed }) => [styles.viewButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.viewLabel}>View spot</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss alarm"
            onPress={onDismiss}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.dismissLabel}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  spotList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  spotListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spotRowPressed: {
    backgroundColor: colors.slate50,
  },
  spotRowIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotRowText: {
    flex: 1,
    minWidth: 0,
  },
  spotRowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  spotRowSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  actions: {
    gap: spacing.md,
  },
  dismissButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  dismissLabel: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  viewButton: {
    width: '100%',
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  viewLabel: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
