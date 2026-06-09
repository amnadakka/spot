import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '../theme/colors';
import { radii } from '../theme/spacing';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const MAP_DELTA = 0.01;

function regionForCoordinate(coordinate: MapCoordinate): Region {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };
}

type CenterPinMapPickerProps = {
  coordinate: MapCoordinate | null;
  onCoordinateChange: (coordinate: MapCoordinate) => void;
  addressLabel: string;
  onRefreshLocation: () => void;
  loading?: boolean;
};

export default function CenterPinMapPicker({
  coordinate,
  onCoordinateChange,
  addressLabel,
  onRefreshLocation,
  loading = false,
}: CenterPinMapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const isDragging = useRef(false);

  const animateTo = useCallback((next: MapCoordinate) => {
    const region = regionForCoordinate(next);
    mapRef.current?.animateToRegion(region, 350);
  }, []);

  useEffect(() => {
    if (!coordinate || !ready || isDragging.current) {
      return;
    }
    animateTo(coordinate);
  }, [animateTo, coordinate, ready]);

  const handleRegionChange = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      isDragging.current = false;
      onCoordinateChange({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    },
    [onCoordinateChange],
  );

  const initialRegion = coordinate
    ? regionForCoordinate(coordinate)
    : {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      };

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={() => setReady(true)}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled={!loading}
        zoomEnabled={!loading}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation
        showsMyLocationButton={false}
      />

      <View style={styles.pinOverlay} pointerEvents="none">
        <Ionicons name="location" size={40} color={colors.primary} style={styles.pinIcon} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
        onPress={onRefreshLocation}
        disabled={loading}
      >
        <Ionicons name="refresh" size={18} color={colors.primary} />
      </Pressable>

      <View style={styles.addressPill} pointerEvents="none">
        <View style={styles.addressInner}>
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          <Text style={styles.addressText} numberOfLines={1}>
            {addressLabel}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.slate100,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinIcon: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  refreshBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshBtnPressed: {
    backgroundColor: colors.slate50,
    transform: [{ scale: 0.95 }],
  },
  addressPill: {
    position: 'absolute',
    left: 12,
    right: 56,
    bottom: 12,
  },
  addressInner: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 36,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
