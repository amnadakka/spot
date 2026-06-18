import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { MAX_ACTIVE_SPOTS_MESSAGE } from '../types/reminder';
import type { Reminder } from '../types/reminder';

import Toggle from './ui/Toggle';

type SpotListProps = {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onAdd: () => void;
  onSpotPress: (id: string) => void;
  addDisabled?: boolean;
  occupiedSpotIds?: Set<string>;
};

export default function SpotList({
  reminders,
  onToggle,
  onDelete,
  onDeleteMany,
  onAdd,
  onSpotPress,
  addDisabled = false,
  occupiedSpotIds,
}: SpotListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;
  const allSelected = reminders.length > 0 && selectedCount === reminders.length;

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
    setSelectedIds(new Set(reminders.map((reminder) => reminder.id)));
  }, [allSelected, reminders]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCount === 0) {
      return;
    }

    const ids = [...selectedIds];
    const message =
      selectedCount === 1
        ? 'Delete this spot? This cannot be undone.'
        : `Delete ${selectedCount} spots? This cannot be undone.`;

    Alert.alert('Delete spots', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          onDeleteMany(ids);
          exitEditMode();
        },
      },
    ]);
  }, [exitEditMode, onDeleteMany, selectedCount, selectedIds]);

  const handleFabPress = () => {
    if (addDisabled) {
      Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
      return;
    }
    onAdd();
  };

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

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          editing && selectedCount > 0 && styles.listContentWithDeleteBar,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        extraData={{ editing, selectedIds, deletingId }}
        renderItem={({ item }) => {
          const isOccupied = occupiedSpotIds?.has(item.id) ?? false;
          const isSelected = selectedIds.has(item.id);

          return (
            <Pressable
              style={[
                styles.card,
                isOccupied && styles.cardOccupied,
                editing && isSelected && styles.cardSelected,
              ]}
              onPress={() => {
                if (editing) {
                  toggleSelection(item.id);
                  return;
                }
                onSpotPress(item.id);
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
                <View
                  style={[
                    styles.iconWrap,
                    isOccupied
                      ? styles.iconWrapOccupied
                      : item.enabled
                        ? styles.iconWrapActive
                        : styles.iconWrapInactive,
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={18}
                    color={
                      isOccupied ? colors.destructive : item.enabled ? colors.primary : colors.slate300
                    }
                  />
                </View>
              )}

              <View style={styles.info}>
                <Text
                  style={[
                    styles.title,
                    isOccupied && styles.titleOccupied,
                    !item.enabled && !isOccupied && styles.titleInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={styles.address} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>

              {!editing ? (
                <>
                  <Toggle enabled={item.enabled} onToggle={() => onToggle(item.id)} />

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
                        onPress={() => {
                          setDeletingId(null);
                          onDelete(item.id);
                        }}
                      >
                        <Text style={styles.deleteLabel}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.trashBtn, pressed && styles.trashBtnPressed]}
                      onPress={() => setDeletingId(item.id)}
                      accessibilityLabel="Delete spot"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.slate300} />
                    </Pressable>
                  )}
                </>
              ) : null}
            </Pressable>
          );
        }}
      />

      {editing ? (
        <View style={styles.deleteBar}>
          <Text style={styles.deleteBarCount}>
            {selectedCount === 0 ? 'Select spots to delete' : `${selectedCount} selected`}
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
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            addDisabled && styles.fabDisabled,
            pressed && !addDisabled && styles.fabPressed,
          ]}
          onPress={handleFabPress}
          accessibilityLabel="Add new spot"
          accessibilityState={{ disabled: addDisabled }}
        >
          <Ionicons name="add" size={28} color={colors.surface} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 88,
    gap: spacing.md,
  },
  listContentWithDeleteBar: {
    paddingBottom: 120,
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
  cardOccupied: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.destructive,
    borderWidth: 1.5,
    shadowColor: colors.destructive,
    shadowOpacity: 0.12,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  iconWrapInactive: {
    backgroundColor: colors.slate50,
  },
  iconWrapOccupied: {
    backgroundColor: '#FEE2E2',
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
  titleInactive: {
    color: colors.slate400,
  },
  titleOccupied: {
    color: colors.destructiveDark,
  },
  address: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
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
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fabDisabled: {
    backgroundColor: colors.slate300,
    shadowOpacity: 0.1,
  },
  fabPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.95 }],
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
