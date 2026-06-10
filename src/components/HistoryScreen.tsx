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
  onEventPress?: (reminderId: string) => void;
};

export default function HistoryScreen({ refreshKey = 0, onEventPress }: HistoryScreenProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
          onPress={() => onEventPress?.(item.reminderId)}
          disabled={!onEventPress}
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
});
