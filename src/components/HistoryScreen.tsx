import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { loadHistory } from '../storage/history';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import type { HistoryEvent } from '../types/history';
import { timeAgo } from '../utils/timeAgo';

type HistoryScreenProps = {
  refreshKey?: number;
  onEventPress?: (event: HistoryEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
};

export default function HistoryScreen({
  refreshKey = 0,
  onEventPress,
  onDeleteEvent,
}: HistoryScreenProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void loadHistory().then((loaded) => {
      if (!cancelled) {
        setEvents(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDelete = (eventId: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    setDeletingId(null);
    onDeleteEvent?.(eventId);
  };

  if (!loading && events.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="time-outline" size={28} color={colors.slate300} />
        </View>
        <Text style={styles.emptyTitle}>No history yet</Text>
        <Text style={styles.emptySubtitle}>Triggered spots will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => onEventPress?.(item)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.spotTitle}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <Text style={styles.time}>{timeAgo(item.triggeredAt)}</Text>

          {deletingId === item.id ? (
            <View style={styles.deleteActions}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
                onPress={() => setDeletingId(null)}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.trashBtn, pressed && styles.trashBtnPressed]}
              onPress={() => setDeletingId(item.id)}
              accessibilityLabel="Delete history entry"
            >
              <Ionicons name="trash-outline" size={16} color={colors.slate300} />
            </Pressable>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate700,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.slate400,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
  },
  address: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate400,
  },
  deleteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.slate100,
  },
  cancelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate500,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.destructive,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  trashBtnPressed: {
    backgroundColor: '#FEF2F2',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
