import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import type { Reminder } from '../types/reminder';
import { formatLocalDateTime } from '../utils/formatLocalDateTime';

type SpotDetailScreenProps = {
  reminder: Reminder;
  /** When opened from history, the local time the geofence notification fired. */
  triggeredAt?: string;
};

const MAP_DELTA = 0.008;

export default function SpotDetailScreen({ reminder, triggeredAt }: SpotDetailScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  const region: Region = {
    latitude: reminder.latitude,
    longitude: reminder.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
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
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, reminder.enabled ? styles.statusActive : styles.statusInactive]} />
          <Text style={styles.statusLabel}>{reminder.enabled ? 'Active' : 'Paused'}</Text>
        </View>

        <Text style={styles.title}>{reminder.title}</Text>

        <View style={styles.divider} />

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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
