import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '../theme/colors';
import type { Reminder } from '../types/reminder';
import type { Coordinate } from '../utils/geo';

const MAP_DELTA = 0.012;

type HomeLiveMapProps = {
  reminders: Reminder[];
  occupiedSpotIds: Set<string>;
  userLocation: Coordinate | null;
};

export default function HomeLiveMap({ reminders, occupiedSpotIds, userLocation }: HomeLiveMapProps) {
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

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      }
    : {
        latitude: 50.9375,
        longitude: 6.9603,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      };

  return (
    <View style={styles.container}>
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
      >
        {activeReminders.map((reminder) => (
          <Marker
            key={reminder.id}
            coordinate={{
              latitude: reminder.latitude,
              longitude: reminder.longitude,
            }}
            title={reminder.title}
            description={reminder.address}
            pinColor={occupiedSpotIds.has(reminder.id) ? colors.destructive : colors.primaryDark}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '30%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.slate100,
  },
  map: {
    flex: 1,
  },
});
