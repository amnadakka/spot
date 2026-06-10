import * as Location from 'expo-location';
import { Accuracy } from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { colors } from '../theme/colors';
import type { Reminder } from '../types/reminder';

const MAP_DELTA = 0.012;

type HomeLiveMapProps = {
  reminders: Reminder[];
};

export default function HomeLiveMap({ reminders }: HomeLiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function startTracking() {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn || cancelled) {
        return;
      }

      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted || cancelled) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 3000,
        },
        (position) => {
          const next: Region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: MAP_DELTA,
            longitudeDelta: MAP_DELTA,
          };
          setRegion(next);
          if (ready) {
            mapRef.current?.animateToRegion(next, 400);
          }
        },
      );
    }

    void startTracking();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [ready]);

  const activeReminders = reminders.filter((r) => r.enabled);

  const initialRegion = region ?? {
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
            pinColor={colors.primaryDark}
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
