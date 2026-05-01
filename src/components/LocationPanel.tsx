import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserLocationStatus } from '../hooks/useUserLocation';

type LocationPanelProps = {
  status: UserLocationStatus;
};

export default function LocationPanel({ status }: LocationPanelProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Your location</Text>

      {status.kind === 'loading' && (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={styles.muted}>Getting location…</Text>
        </View>
      )}

      {status.kind === 'services_disabled' && (
        <View>
          <Text style={styles.warning}>Location services are turned off on this device.</Text>
          <SettingsLink />
        </View>
      )}

      {status.kind === 'foreground_denied' && (
        <View>
          <Text style={styles.warning}>
            Location permission was denied. Allow location access for this app to see coordinates and
            use place-based reminders.
          </Text>
          <SettingsLink />
        </View>
      )}

      {status.kind === 'position_error' && (
        <Text style={styles.warning}>{status.message}</Text>
      )}

      {status.kind === 'ok' && (
        <View>
          <Text style={styles.coords}>Latitude: {status.latitude.toFixed(6)}</Text>
          <Text style={styles.coords}>Longitude: {status.longitude.toFixed(6)}</Text>
          {!status.backgroundGranted ? (
            <Text style={styles.note}>
              Background location wasn’t granted. Nearby reminders may not work when the app isn’t
              open.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

function SettingsLink() {
  return (
    <Pressable onPress={() => Linking.openSettings()} style={styles.linkWrap}>
      <Text style={styles.link}>Open settings</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muted: {
    fontSize: 15,
    color: '#6b7280',
  },
  coords: {
    fontSize: 16,
    marginBottom: 4,
  },
  warning: {
    fontSize: 15,
    color: '#92400e',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  linkWrap: {
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});
