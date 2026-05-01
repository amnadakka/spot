import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import CreateReminderForm from '../components/CreateReminderForm';
import LocationPanel from '../components/LocationPanel';
import ReminderList from '../components/ReminderList';
import { useReminderGeofencingSync } from '../hooks/useReminderGeofencingSync';
import { useUserLocation } from '../hooks/useUserLocation';
import type { Reminder } from '../types/reminder';

function makeReminderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const locationStatus = useUserLocation();

  useReminderGeofencingSync(reminders);

  const handleSaveReminder = useCallback((draft: Omit<Reminder, 'id'>) => {
    setReminders((prev) => [...prev, { ...draft, id: makeReminderId() }]);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <Text style={styles.heading}>Location reminders</Text>
          <LocationPanel status={locationStatus} />
          <CreateReminderForm onSave={handleSaveReminder} />
          <ReminderList reminders={reminders} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  inner: {
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
});
