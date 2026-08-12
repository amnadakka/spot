import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { Reminder } from '../types/reminder';

import { SpotSelectionActionBar } from './SpotList';

type TextScreenProps = {
  reminders: Reminder[];
  onAdd?: () => void;
  addDisabled?: boolean;
  onSpotPress?: (reminderId: string) => void;
  onSetEnabledMany?: (ids: string[], enabled: boolean) => void;
  onDeleteMany?: (ids: string[]) => void;
};

function formatReminderText(
  reminder: Reminder,
  nearbyTemplate: string,
  withDescriptionTemplate: string,
): string {
  const title = reminder.title.trim();
  const description = reminder.description?.trim();

  if (description) {
    return fill(withDescriptionTemplate, { title, description });
  }

  return fill(nearbyTemplate, { title });
}

export default function TextScreen({
  reminders,
  onAdd,
  addDisabled = false,
  onSpotPress,
  onSetEnabledMany,
  onDeleteMany,
}: TextScreenProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const activeReminders = useMemo(
    () => reminders.filter((reminder) => reminder.enabled),
    [reminders],
  );

  const selectedCount = selectedIds.size;
  const allSelected =
    activeReminders.length > 0 && selectedCount === activeReminders.length;
  const selectedReminders = useMemo(
    () => activeReminders.filter((reminder) => selectedIds.has(reminder.id)),
    [activeReminders, selectedIds],
  );
  const allSelectedEnabled =
    selectedReminders.length > 0 && selectedReminders.every((reminder) => reminder.enabled);
  const bulkEnable = !allSelectedEnabled;
  const canSelect = Boolean(onSetEnabledMany || onDeleteMany);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const enterSelection = useCallback((id: string) => {
    setSelecting(true);
    setSelectedIds(new Set([id]));
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
    setSelectedIds(new Set(activeReminders.map((reminder) => reminder.id)));
  }, [allSelected, activeReminders]);

  const handleDeleteSelected = useCallback(() => {
    if (!onDeleteMany || selectedCount === 0) {
      return;
    }

    const ids = [...selectedIds];
    const message =
      selectedCount === 1
        ? t.deleteSpotConfirmOne
        : fill(t.deleteSpotsConfirmMany, { count: selectedCount });

    Alert.alert(t.deleteSpotsTitle, message, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          onDeleteMany(ids);
          exitSelection();
        },
      },
    ]);
  }, [exitSelection, onDeleteMany, selectedCount, selectedIds, t]);

  const handleBulkToggle = useCallback(() => {
    if (!onSetEnabledMany || selectedCount === 0) {
      return;
    }
    onSetEnabledMany([...selectedIds], bulkEnable);
  }, [bulkEnable, onSetEnabledMany, selectedCount, selectedIds]);

  const handleAddPress = useCallback(() => {
    if (!onAdd) {
      return;
    }
    if (addDisabled) {
      Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
      return;
    }
    onAdd();
  }, [addDisabled, onAdd, t]);

  useEffect(() => {
    if (selecting && activeReminders.length === 0) {
      exitSelection();
    }
  }, [activeReminders.length, exitSelection, selecting]);

  useEffect(() => {
    if (!selecting) {
      return;
    }
    const validIds = new Set(activeReminders.map((reminder) => reminder.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [activeReminders, selecting]);

  const addButton =
    onAdd != null ? (
      <Pressable
        style={({ pressed }) => [
          styles.addBtn,
          addDisabled && styles.addBtnDisabled,
          pressed && !addDisabled && styles.pressedSoft,
        ]}
        onPress={handleAddPress}
        accessibilityRole="button"
        accessibilityLabel={t.addNewSpotA11y}
        accessibilityState={{ disabled: addDisabled }}
      >
        <Ionicons name="add" size={26} color={addDisabled ? colors.slate300 : colors.accent} />
      </Pressable>
    ) : null;

  if (activeReminders.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>{addButton}</View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>{t.textEmptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{t.textEmptySubtitle}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selecting ? (
        <View style={styles.selectionHeader}>
          <Pressable
            style={({ pressed }) => [styles.selectAllBtn, pressed && styles.pressedSoft]}
            onPress={handleSelectAllPress}
            accessibilityRole="button"
            accessibilityLabel={allSelected ? t.deselectAll : t.selectAll}
          >
            <Text style={styles.selectAllLabel} numberOfLines={1}>
              {allSelected ? t.deselectAll : t.selectAll}
            </Text>
          </Pressable>
          <Text
            style={styles.selectionCount}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {fill(t.selectedCount, { count: selectedCount })}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressedSoft]}
            onPress={exitSelection}
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
          >
            <Text style={styles.cancelLabel}>{t.cancel}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.header}>{addButton}</View>
      )}

      <FlatList
        data={activeReminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          selecting && styles.listContentWithActionBar,
        ]}
        showsVerticalScrollIndicator={false}
        extraData={{ selecting, selectedIds }}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                selecting && isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => {
                if (selecting) {
                  toggleSelection(item.id);
                  return;
                }
                onSpotPress?.(item.id);
              }}
              onLongPress={() => {
                if (canSelect && !selecting) {
                  enterSelection(item.id);
                }
              }}
              delayLongPress={350}
              accessibilityRole={selecting ? 'checkbox' : 'button'}
              accessibilityState={selecting ? { checked: isSelected } : undefined}
              accessibilityLabel={item.title}
            >
              {selecting ? (
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.cardText}>
                {formatReminderText(
                  item,
                  t.textRemindNearby,
                  t.textRemindNearbyWithDescription,
                )}
              </Text>
            </Pressable>
          );
        }}
      />

      {selecting ? (
        <SpotSelectionActionBar
          selectedCount={selectedCount}
          bulkEnable={bulkEnable}
          onBulkToggle={handleBulkToggle}
          onDeleteSelected={handleDeleteSelected}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 40,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: 40,
    gap: spacing.sm,
  },
  selectAllBtn: {
    flexShrink: 1,
    minWidth: 48,
    maxWidth: 130,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  selectAllLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
  },
  selectionCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  cancelBtn: {
    flexShrink: 1,
    minWidth: 48,
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  pressedSoft: {
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  listContentWithActionBar: {
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.accent,
  },
  cardPressed: {
    opacity: 0.85,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
}));
