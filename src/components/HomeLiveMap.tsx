import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import type { Reminder } from '../types/reminder';
import type { Coordinate } from '../utils/geo';

const MAP_DELTA = 0.012;

type MapPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type HomeLiveMapProps = {
  reminders: Reminder[];
  occupiedSpotIds: Set<string>;
  userLocation: Coordinate | null;
  style?: StyleProp<ViewStyle>;
  mapPadding?: MapPadding;
  onSpotPress?: (reminderId: string) => void;
};

export default function HomeLiveMap({
  reminders,
  occupiedSpotIds,
  userLocation,
  style,
  mapPadding,
  onSpotPress,
}: HomeLiveMapProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !userLocation) {
      return;
    }

    const next: Region = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: MAP_DELTA,
      longitudeDelta: MAP_DELTA,
    };
    mapRef.current?.animateToRegion(next, 400);
  }, [ready, userLocation]);

  const activeReminders = reminders.filter((r) => r.enabled);

  if (!userLocation) {
    return (
      <View style={[styles.container, styles.loading, style]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  const initialRegion = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={() => setReady(true)}
        showsUserLocation
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled
        zoomEnabled
        mapPadding={mapPadding}
      >
        {activeReminders.map((reminder) => (
          <Marker
            key={reminder.id}
            coordinate={{
              latitude: reminder.latitude,
              longitude: reminder.longitude,
            }}
            title={reminder.title}
            description={reminder.description?.trim() || undefined}
            pinColor={occupiedSpotIds.has(reminder.id) ? colors.destructive : colors.primaryDark}
            onPress={() => onSpotPress?.(reminder.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.slate100,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
}));
