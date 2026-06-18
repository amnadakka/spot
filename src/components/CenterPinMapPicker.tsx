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

const DEFAULT_MAP_DELTA = 0.01;
const MIN_MAP_DELTA = 0.0005;
const MAX_MAP_DELTA = 0.45;
const ZOOM_IN_FACTOR = 0.5;
const ZOOM_OUT_FACTOR = 2;

function clampMapDelta(delta: number): number {
  return Math.min(MAX_MAP_DELTA, Math.max(MIN_MAP_DELTA, delta));
}

function regionForCoordinate(coordinate: MapCoordinate, delta = DEFAULT_MAP_DELTA): Region {
  const clampedDelta = clampMapDelta(delta);
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: clampedDelta,
    longitudeDelta: clampedDelta,
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
  const regionDeltaRef = useRef(DEFAULT_MAP_DELTA);
  const coordinateFromMapRef = useRef(false);
  const currentCenterRef = useRef<MapCoordinate | null>(null);

  const animateTo = useCallback((next: MapCoordinate, delta = regionDeltaRef.current) => {
    const region = regionForCoordinate(next, delta);
    regionDeltaRef.current = region.latitudeDelta;
    mapRef.current?.animateToRegion(region, 350);
  }, []);

  useEffect(() => {
    if (!coordinate || !ready || isDragging.current) {
      return;
    }
    if (coordinateFromMapRef.current) {
      coordinateFromMapRef.current = false;
      return;
    }
    animateTo(coordinate);
    currentCenterRef.current = coordinate;
  }, [animateTo, coordinate, ready]);

  const handleRegionChange = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      isDragging.current = false;
      regionDeltaRef.current = region.latitudeDelta;
      coordinateFromMapRef.current = true;
      currentCenterRef.current = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      onCoordinateChange(currentCenterRef.current);
    },
    [onCoordinateChange],
  );

  const handleZoom = useCallback(
    (factor: number) => {
      const center = currentCenterRef.current ?? coordinate;
      if (!center || loading) {
        return;
      }

      const nextDelta = clampMapDelta(regionDeltaRef.current * factor);
      regionDeltaRef.current = nextDelta;
      coordinateFromMapRef.current = true;
      mapRef.current?.animateToRegion(regionForCoordinate(center, nextDelta), 200);
    },
    [coordinate, loading],
  );

  const initialRegion = coordinate
    ? regionForCoordinate(coordinate)
    : {
        latitude: 40.7128,
        longitude: -74.006,
        latitudeDelta: DEFAULT_MAP_DELTA,
        longitudeDelta: DEFAULT_MAP_DELTA,
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

      <View style={styles.zoomControls}>
        <Pressable
          style={({ pressed }) => [
            styles.zoomBtn,
            styles.zoomBtnTop,
            pressed && styles.zoomBtnPressed,
            loading && styles.zoomBtnDisabled,
          ]}
          onPress={() => handleZoom(ZOOM_IN_FACTOR)}
          disabled={loading}
          accessibilityLabel="Zoom in"
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.zoomBtn,
            styles.zoomBtnBottom,
            pressed && styles.zoomBtnPressed,
            loading && styles.zoomBtnDisabled,
          ]}
          onPress={() => handleZoom(ZOOM_OUT_FACTOR)}
          disabled={loading}
          accessibilityLabel="Zoom out"
        >
          <Ionicons name="remove" size={20} color={colors.primary} />
        </Pressable>
      </View>

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
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 56,
  },
  zoomBtn: {
    width: 40,
    height: 40,
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
  zoomBtnTop: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 0,
  },
  zoomBtnBottom: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  zoomBtnPressed: {
    backgroundColor: colors.slate50,
  },
  zoomBtnDisabled: {
    opacity: 0.5,
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
