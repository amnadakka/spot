import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

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

type LocationMapPickerProps = {
  coordinate: MapCoordinate | null;
  onCoordinateChange: (coordinate: MapCoordinate) => void;
  /** When true, map gestures are disabled (e.g. while fetching GPS). */
  disabled?: boolean;
};

export default function LocationMapPicker({
  coordinate,
  onCoordinateChange,
  disabled = false,
}: LocationMapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);

  const animateTo = useCallback((next: MapCoordinate) => {
    const region = regionForCoordinate(next);
    mapRef.current?.animateToRegion(region, 350);
  }, []);

  useEffect(() => {
    if (!coordinate || !ready) return;
    animateTo(coordinate);
  }, [animateTo, coordinate, ready]);

  const handleMapPress = useCallback(
    (event: { nativeEvent: { coordinate: MapCoordinate } }) => {
      if (disabled) return;
      onCoordinateChange(event.nativeEvent.coordinate);
    },
    [disabled, onCoordinateChange],
  );

  const handleMarkerDragEnd = useCallback(
    (event: { nativeEvent: { coordinate: MapCoordinate } }) => {
      onCoordinateChange(event.nativeEvent.coordinate);
    },
    [onCoordinateChange],
  );

  const initialRegion = coordinate
    ? regionForCoordinate(coordinate)
    : {
        latitude: 37.7749,
        longitude: -122.4194,
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
        onPress={handleMapPress}
        scrollEnabled={!disabled}
        zoomEnabled={!disabled}
        rotateEnabled={!disabled}
        pitchEnabled={!disabled}
        showsUserLocation
        showsMyLocationButton={Platform.OS === 'android'}
      >
        {coordinate ? (
          <Marker
            coordinate={coordinate}
            draggable={!disabled}
            onDragEnd={handleMarkerDragEnd}
          />
        ) : null}
      </MapView>
      {disabled ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#1e40af" size="large" />
        </View>
      ) : null}
      <Text style={styles.hint}>
        {coordinate
          ? 'Tap the map or drag the pin to adjust the reminder location.'
          : 'Tap the map or use “Use current location” to choose a spot.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
});
