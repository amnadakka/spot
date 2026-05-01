import { StyleSheet, Text, View } from 'react-native';

import type { Reminder } from '../types/reminder';

type ReminderListProps = {
  reminders: Reminder[];
};

export default function ReminderList({ reminders }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No reminders yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <Text style={styles.listHeading}>Saved reminders</Text>
      {reminders.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
          <Text style={styles.meta}>Radius: {item.radiusMeters} m</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 32,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
