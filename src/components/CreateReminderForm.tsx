import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import LocationMapPicker, { type MapCoordinate } from './LocationMapPicker';
import { getCurrentCoordinates } from '../services/getCurrentCoordinates';
import type { Reminder } from '../types/reminder';
import { DEFAULT_REMINDER_RADIUS_METERS } from '../types/reminder';

type CreateReminderFormProps = {
  onSave: (reminder: Omit<Reminder, 'id'>) => void;
};

export default function CreateReminderForm({ onSave }: CreateReminderFormProps) {
  const [title, setTitle] = useState('');
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapBootstrapping, setMapBootstrapping] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await getCurrentCoordinates();
        if (!cancelled) {
          setCoordinate(next);
        }
      } catch {
        // Map still works; user can tap or use the location button.
      } finally {
        if (!cancelled) {
          setMapBootstrapping(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setLocationNote(null);
    setLocationLoading(true);
    try {
      const next = await getCurrentCoordinates();
      setCoordinate(next);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not get location.';
      setLocationNote(message);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    setSaveError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setSaveError('Enter a title.');
      return;
    }
    if (!coordinate) {
      setSaveError('Choose a location on the map or use current location.');
      return;
    }

    onSave({
      title: trimmed,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radiusMeters: DEFAULT_REMINDER_RADIUS_METERS,
    });
    setTitle('');
    setCoordinate(null);
    setLocationNote(null);
    void getCurrentCoordinates()
      .then(setCoordinate)
      .catch(() => setCoordinate(null));
  }, [coordinate, onSave, title]);

  const mapBusy = locationLoading || mapBootstrapping;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>New reminder</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
        editable={!mapBusy}
      />

      <Text style={styles.sectionLabel}>Location</Text>
      <LocationMapPicker
        coordinate={coordinate}
        onCoordinateChange={setCoordinate}
        disabled={mapBusy}
      />

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        onPress={handleUseCurrentLocation}
        disabled={mapBusy}
      >
        {locationLoading ? (
          <ActivityIndicator color="#1e40af" />
        ) : (
          <Text style={styles.secondaryButtonLabel}>Use current location</Text>
        )}
      </Pressable>

      {coordinate ? (
        <Text style={styles.coordsPreview}>
          {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)} · radius{' '}
          {DEFAULT_REMINDER_RADIUS_METERS} m
        </Text>
      ) : mapBootstrapping ? (
        <Text style={styles.hint}>Loading map near you…</Text>
      ) : (
        <Text style={styles.hint}>Pick a spot on the map to set the reminder location.</Text>
      )}

      {locationNote ? <Text style={styles.warning}>{locationNote}</Text> : null}
      {saveError ? <Text style={styles.warning}>{saveError}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        onPress={handleSave}
      >
        <Text style={styles.primaryButtonLabel}>Save reminder</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#111827',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  coordsPreview: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  hint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  warning: {
    fontSize: 14,
    color: '#b45309',
    marginTop: 8,
  },
});
