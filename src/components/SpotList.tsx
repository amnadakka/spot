import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
  onAdd: () => void;
  onSpotPress: (id: string) => void;
  addDisabled?: boolean;
};

export default function SpotList({
  reminders,
  onToggle,
  onDelete,
  onAdd,
  onSpotPress,
  addDisabled = false,
}: SpotListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFabPress = () => {
    if (addDisabled) {
      Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
      return;
    }
    onAdd();
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onSpotPress(item.id)}>
            <View style={[styles.iconWrap, item.enabled ? styles.iconWrapActive : styles.iconWrapInactive]}>
              <Ionicons
                name="location"
                size={18}
                color={item.enabled ? colors.primary : colors.slate300}
              />
            </View>

            <View style={styles.info}>
              <Text style={[styles.title, !item.enabled && styles.titleInactive]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {item.address}
              </Text>
            </View>

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
          </Pressable>
        )}
      />

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
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  iconWrapInactive: {
    backgroundColor: colors.slate50,
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
});
