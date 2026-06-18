import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { loadHistory } from '../storage/history';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import type { HistoryEvent } from '../types/history';
import { timeAgo } from '../utils/timeAgo';

type HistoryScreenProps = {
  refreshKey?: number;
  onEventPress?: (event: HistoryEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onDeleteEvents?: (eventIds: string[]) => void;
};

function matchesHistorySearch(event: HistoryEvent, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (event.spotTitle.toLowerCase().includes(normalized)) {
    return true;
  }

  if (event.description?.toLowerCase().includes(normalized)) {
    return true;
  }

  return false;
}

export default function HistoryScreen({
  refreshKey = 0,
  onEventPress,
  onDeleteEvent,
  onDeleteEvents,
}: HistoryScreenProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

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

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesHistorySearch(event, query)),
    [events, query],
  );

  const selectedCount = selectedIds.size;
  const allSelected =
    filteredEvents.length > 0 && filteredEvents.every((event) => selectedIds.has(event.id));

  const exitEditMode = useCallback(() => {
    setEditing(false);
    setSelectedIds(new Set());
    setDeletingId(null);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllPress = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredEvents.map((event) => event.id)));
  }, [allSelected, filteredEvents]);

  const handleDelete = useCallback(
    (eventId: string) => {
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      setDeletingId(null);
      onDeleteEvent?.(eventId);
    },
    [onDeleteEvent],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedCount === 0) {
      return;
    }

    const ids = [...selectedIds];
    const message =
      selectedCount === 1
        ? 'Delete this history entry? This cannot be undone.'
        : `Delete ${selectedCount} history entries? This cannot be undone.`;

    Alert.alert('Delete history', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEvents((prev) => prev.filter((event) => !selectedIds.has(event.id)));
          if (onDeleteEvents) {
            onDeleteEvents(ids);
          } else {
            ids.forEach((id) => onDeleteEvent?.(id));
          }
          exitEditMode();
        },
      },
    ]);
  }, [exitEditMode, onDeleteEvent, onDeleteEvents, selectedCount, selectedIds]);

  const listHeader = useMemo(
    () => (
      <View style={[styles.toolbar, editing && styles.toolbarEditing]}>
        {editing ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
              onPress={handleSelectAllPress}
            >
              <Text style={styles.toolbarBtnLabel}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
              onPress={exitEditMode}
            >
              <Text style={styles.toolbarBtnLabelMuted}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.toolbarBtn, pressed && styles.toolbarBtnPressed]}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.toolbarBtnLabel}>Edit</Text>
          </Pressable>
        )}
      </View>
    ),
    [allSelected, editing, exitEditMode, handleSelectAllPress],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (events.length === 0) {
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
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or description…"
            placeholderTextColor={colors.slate400}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="never"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={colors.slate400} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsTitle}>No matching history</Text>
          <Text style={styles.noResultsSubtitle}>Try a different title or description.</Text>
        </View>
      ) : (
        <>
          <FlatList
            style={styles.list}
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              editing && selectedCount > 0 && styles.listContentWithDeleteBar,
            ]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={listHeader}
            keyboardShouldPersistTaps="handled"
            extraData={{ editing, selectedIds, deletingId, query }}
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <Pressable
                  style={[styles.card, editing && isSelected && styles.cardSelected]}
                  onPress={() => {
                    if (editing) {
                      toggleSelection(item.id);
                      return;
                    }
                    onEventPress?.(item);
                  }}
                >
                  {editing ? (
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'ellipse-outline'}
                        size={isSelected ? 16 : 18}
                        color={isSelected ? colors.surface : colors.slate300}
                      />
                    </View>
                  ) : (
                    <View style={styles.iconWrap}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    </View>
                  )}

                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.spotTitle}
                    </Text>
                    {item.description ? (
                      <Text style={styles.description} numberOfLines={1}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={styles.address} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>

                  {!editing ? (
                    <>
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
                    </>
                  ) : (
                    <Text style={styles.time}>{timeAgo(item.triggeredAt)}</Text>
                  )}
                </Pressable>
              );
            }}
          />

          {editing ? (
            <View style={styles.deleteBar}>
              <Text style={styles.deleteBarCount}>
                {selectedCount === 0 ? 'Select entries to delete' : `${selectedCount} selected`}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBarBtn,
                  selectedCount === 0 && styles.deleteBarBtnDisabled,
                  pressed && selectedCount > 0 && styles.deleteBarBtnPressed,
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedCount === 0}
              >
                <Ionicons name="trash-outline" size={16} color={colors.surface} />
                <Text style={styles.deleteBarBtnLabel}>Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.slate700,
    padding: 0,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate700,
  },
  noResultsSubtitle: {
    fontSize: 13,
    color: colors.slate400,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  listContentWithDeleteBar: {
    paddingBottom: 96,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  toolbarEditing: {
    justifyContent: 'space-between',
  },
  toolbarBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  toolbarBtnPressed: {
    backgroundColor: colors.slate100,
  },
  toolbarBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  toolbarBtnLabelMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate500,
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
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  description: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
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
  deleteBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  deleteBarCount: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate500,
  },
  deleteBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.destructive,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  deleteBarBtnDisabled: {
    backgroundColor: colors.slate300,
  },
  deleteBarBtnPressed: {
    backgroundColor: colors.destructiveDark,
  },
  deleteBarBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.surface,
  },
});
