import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import { configureAlarmAudioMode } from '../audio/configureAlarmAudio';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

export type ActiveGeofenceAlarm = {
  regionId: string;
  title: string;
  subtitle: string;
};

type GeofenceAlarmRingingLayerProps = {
  alarm: ActiveGeofenceAlarm;
  onDismiss: () => void;
  onViewSpot: () => void;
};

export default function GeofenceAlarmRingingLayer({
  alarm,
  onDismiss,
  onViewSpot,
}: GeofenceAlarmRingingLayerProps) {
  const player = useAudioPlayer(require('../../assets/alarm_ringtone.wav'));

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
        <View style={styles.iconWrap}>
          <Ionicons name="alarm" size={56} color={colors.primary} />
        </View>

        <Text style={styles.eyebrow}>Spot alarm</Text>
        <Text style={styles.title}>{alarm.title}</Text>
        <Text style={styles.subtitle}>{alarm.subtitle}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss alarm"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.dismissLabel}>Dismiss</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View spot details"
          onPress={onViewSpot}
          style={({ pressed }) => [styles.viewButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.viewLabel}>View spot</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
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
