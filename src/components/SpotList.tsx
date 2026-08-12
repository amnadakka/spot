import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { Reminder } from '../types/reminder';

import Toggle from './ui/Toggle';

export type SpotSelectionFooterState = {
  selectedCount: number;
  bulkEnable: boolean;
  onBulkToggle: () => void;
  onDeleteSelected: () => void;
};

type SpotListProps = {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onSetEnabledMany: (ids: string[], enabled: boolean) => void;
  onDeleteMany: (ids: string[]) => void;
  onAdd: () => void;
  onSpotPress: (id: string) => void;
  addDisabled?: boolean;
  occupiedSpotIds?: Set<string>;
  /** Use BottomSheetScrollView so sheet drag + list scroll work together. */
  sheetMode?: boolean;
  sheetHeader?: ReactNode;
  /** Sheet mode: parent pins these actions in BottomSheetFooter. */
  onSheetSelectionChange?: (state: SpotSelectionFooterState | null) => void;
};

export function SpotSelectionActionBar({
  selectedCount,
  bulkEnable = false,
  onBulkToggle,
  onDeleteSelected,
  floating = true,
  showBulkToggle = true,
}: {
  selectedCount: number;
  onDeleteSelected: () => void;
  bulkEnable?: boolean;
  onBulkToggle?: () => void;
  floating?: boolean;
  showBulkToggle?: boolean;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();

  const bar = (
    <View style={styles.actionBar}>
      {showBulkToggle ? (
        <Pressable
          style={({ pressed }) => [
            styles.actionItem,
            selectedCount === 0 && styles.actionItemDisabled,
            pressed && selectedCount > 0 && styles.pressedSoft,
          ]}
          onPress={onBulkToggle}
          disabled={selectedCount === 0}
        >
          <Ionicons
            name={bulkEnable ? 'notifications-outline' : 'notifications-off-outline'}
            size={22}
            color={selectedCount === 0 ? colors.slate300 : colors.slate700}
          />
          <Text style={[styles.actionLabel, selectedCount === 0 && styles.actionLabelDisabled]}>
            {bulkEnable ? t.turnOnSpots : t.turnOffSpots}
          </Text>
        </Pressable>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.actionItem,
          selectedCount === 0 && styles.actionItemDisabled,
          pressed && selectedCount > 0 && styles.pressedSoft,
        ]}
        onPress={onDeleteSelected}
        disabled={selectedCount === 0}
      >
        <Ionicons
          name="trash-outline"
          size={22}
          color={selectedCount === 0 ? colors.slate300 : colors.destructive}
        />
        <Text
          style={[
            styles.actionLabel,
            styles.actionLabelDestructive,
            selectedCount === 0 && styles.actionLabelDisabled,
          ]}
        >
          {t.delete}
        </Text>
      </Pressable>
    </View>
  );

  if (!floating) {
    return <View style={styles.actionBarInlineDock}>{bar}</View>;
  }

  return (
    <View style={styles.actionBarFloatingDock} pointerEvents="box-none">
      {bar}
    </View>
  );
}

export default function SpotList({
  reminders,
  onToggle,
  onSetEnabledMany,
  onDeleteMany,
  onAdd,
  onSpotPress,
  addDisabled = false,
  occupiedSpotIds,
  sheetMode = false,
  sheetHeader,
  onSheetSelectionChange,
}: SpotListProps) {
  const { t } = useI18n();
  const { colors, theme } = useTheme();
  const styles = useStyles();
  const occupiedRowBg = theme === 'night' ? '#3F1D1D' : '#FEF2F2';
  const occupiedIconBg = theme === 'night' ? '#7F1D1D' : '#FEE2E2';
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;
  const allSelected = reminders.length > 0 && selectedCount === reminders.length;

  const selectedReminders = useMemo(
    () => reminders.filter((reminder) => selectedIds.has(reminder.id)),
    [reminders, selectedIds],
  );
  const allSelectedEnabled =
    selectedReminders.length > 0 && selectedReminders.every((reminder) => reminder.enabled);
  const bulkEnable = !allSelectedEnabled;

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
    setSelectedIds(new Set(reminders.map((reminder) => reminder.id)));
  }, [allSelected, reminders]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCount === 0) {
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
    if (selectedCount === 0) {
      return;
    }
    onSetEnabledMany([...selectedIds], bulkEnable);
  }, [bulkEnable, onSetEnabledMany, selectedCount, selectedIds]);

  const handleAddPress = useCallback(() => {
    if (addDisabled) {
      Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
      return;
    }
    onAdd();
  }, [addDisabled, onAdd, t]);

  useEffect(() => {
    if (!sheetMode) {
      return;
    }
    if (!selecting) {
      onSheetSelectionChange?.(null);
      return;
    }
    onSheetSelectionChange?.({
      selectedCount,
      bulkEnable,
      onBulkToggle: handleBulkToggle,
      onDeleteSelected: handleDeleteSelected,
    });
  }, [
    bulkEnable,
    handleBulkToggle,
    handleDeleteSelected,
    onSheetSelectionChange,
    selectedCount,
    selecting,
    sheetMode,
  ]);

  useEffect(() => {
    if (!sheetMode) {
      return;
    }
    return () => {
      onSheetSelectionChange?.(null);
    };
  }, [onSheetSelectionChange, sheetMode]);

  const listHeader = useMemo(() => {
    if (selecting) {
      return (
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
      );
    }

    return (
      <View style={styles.normalHeader}>
        <View style={styles.headerMain}>{sheetHeader}</View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            addDisabled && styles.addBtnDisabled,
            pressed && !addDisabled && styles.pressedSoft,
          ]}
          onPress={handleAddPress}
          accessibilityLabel={t.addNewSpotA11y}
          accessibilityState={{ disabled: addDisabled }}
        >
          <Ionicons
            name="add"
            size={26}
            color={addDisabled ? colors.slate300 : colors.accent}
          />
        </Pressable>
      </View>
    );
  }, [
    addDisabled,
    allSelected,
    colors.accent,
    colors.slate300,
    exitSelection,
    handleAddPress,
    handleSelectAllPress,
    selectedCount,
    selecting,
    sheetHeader,
    styles,
    t,
  ]);

  const contentContainerStyle = [
    styles.listContent,
    sheetMode && styles.listContentSheet,
    selecting && styles.listContentWithActionBar,
  ];

  const listBody = (
    <>
      {listHeader}

      <View style={styles.card}>
        {reminders.map((item, index) => {
          const isOccupied = occupiedSpotIds?.has(item.id) ?? false;
          const isSelected = selectedIds.has(item.id);
          const isLast = index === reminders.length - 1;

          return (
            <View key={item.id}>
              <Pressable
                style={[
                  styles.row,
                  isOccupied && { backgroundColor: occupiedRowBg },
                  selecting && isSelected && styles.rowSelected,
                ]}
                onPress={() => {
                  if (selecting) {
                    toggleSelection(item.id);
                    return;
                  }
                  onSpotPress(item.id);
                }}
                onLongPress={() => {
                  if (!selecting) {
                    enterSelection(item.id);
                  }
                }}
                delayLongPress={350}
                accessibilityRole={selecting ? 'checkbox' : 'button'}
                accessibilityState={selecting ? { checked: isSelected } : undefined}
                accessibilityLabel={item.title}
              >
                {selecting ? (
                  <View
                    style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                    importantForAccessibility="no"
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                    ) : null}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.iconWrap,
                      isOccupied
                        ? { backgroundColor: occupiedIconBg }
                        : item.enabled
                          ? styles.iconWrapActive
                          : styles.iconWrapInactive,
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={
                        isOccupied
                          ? colors.destructive
                          : item.enabled
                            ? colors.accent
                            : colors.slate300
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
                      selecting && isSelected && styles.titleSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.address, selecting && isSelected && styles.addressSelected]}
                    numberOfLines={1}
                  >
                    {item.address}
                  </Text>
                </View>

                {!selecting ? (
                  <Toggle enabled={item.enabled} onToggle={() => onToggle(item.id)} />
                ) : null}
              </Pressable>
              {!isLast ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>
    </>
  );

  // Sheet mode: actions are pinned via BottomSheetFooter in the parent.
  if (sheetMode) {
    return (
      <BottomSheetScrollView
        style={styles.list}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {listBody}
      </BottomSheetScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {listBody}
      </ScrollView>
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  listContentSheet: {
    paddingTop: 0,
  },
  listContentWithActionBar: {
    paddingBottom: 120,
  },
  normalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    minHeight: 56,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    // Slightly lifted card so it reads against the sheet surface in light themes
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  rowSelected: {
    backgroundColor: colors.slate50,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginHorizontal: spacing.lg,
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
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
    backgroundColor: colors.slate100,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate900,
  },
  titleInactive: {
    color: colors.slate400,
  },
  titleOccupied: {
    color: colors.destructiveDark,
  },
  titleSelected: {
    color: colors.slate400,
  },
  address: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },
  addressSelected: {
    color: colors.slate600,
  },
  pressedSoft: {
    opacity: 0.7,
  },
  actionBarFloatingDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionBarInlineDock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  // Content-sized floating toolbar (Material-style): hug actions, ~16dp edge inset.
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  actionItem: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  actionItemDisabled: {
    opacity: 0.45,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate700,
  },
  actionLabelDestructive: {
    color: colors.destructive,
  },
  actionLabelDisabled: {
    color: colors.slate300,
  },
}));
