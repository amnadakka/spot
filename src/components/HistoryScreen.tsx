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

import { useI18n } from '../i18n/I18nContext';
import { fill, localeTag, type AppLanguage } from '../i18n/translations';
import { loadHistory } from '../storage/history';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { HistoryEvent } from '../types/history';

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

function formatHistoryDate(isoDate: string, language: AppLanguage): string {
  return new Date(isoDate).toLocaleDateString(localeTag(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatHistoryTime(isoDate: string, language: AppLanguage): string {
  return new Date(isoDate).toLocaleTimeString(localeTag(language), {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen({
  refreshKey = 0,
  onEventPress,
  onDeleteEvent,
  onDeleteEvents,
}: HistoryScreenProps) {
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);
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
    setSelectedIds(new Set(filteredEvents.map((event) => event.id)));
  }, [allSelected, filteredEvents]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCount === 0) {
      return;
    }

    const ids = [...selectedIds];
    const message =
      selectedCount === 1
        ? t.deleteHistoryConfirmOne
        : fill(t.deleteHistoryConfirmMany, { count: selectedCount });

    Alert.alert(t.deleteHistoryTitle, message, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => {
          setEvents((prev) => prev.filter((event) => !selectedIds.has(event.id)));
          if (onDeleteEvents) {
            onDeleteEvents(ids);
          } else {
            ids.forEach((id) => onDeleteEvent?.(id));
          }
          exitSelection();
        },
      },
    ]);
  }, [exitSelection, onDeleteEvent, onDeleteEvents, selectedCount, selectedIds, t]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="time-outline" size={28} color={colors.slate300} />
        </View>
        <Text style={styles.emptyTitle}>{t.historyEmptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{t.historyEmptySubtitle}</Text>
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
            placeholder={t.historySearchPlaceholder}
            placeholderTextColor={colors.slate400}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="never"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} accessibilityLabel={t.clearSearchA11y}>
              <Ionicons name="close-circle" size={16} color={colors.slate400} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {selecting ? (
        <View style={styles.selectionHeader}>
          <Pressable
            style={({ pressed }) => [styles.selectAllBtn, pressed && styles.pressedSoft]}
            onPress={handleSelectAllPress}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allSelected }}
            accessibilityLabel={allSelected ? t.deselectAll : t.selectAll}
          >
            <View style={[styles.selectAllCircle, allSelected && styles.selectAllCircleSelected]}>
              {allSelected ? (
                <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              ) : null}
            </View>
            <Text style={styles.selectAllLabel}>{t.selectAllShort}</Text>
          </Pressable>

          <Text style={styles.selectionCount}>
            {fill(t.selectedCount, { count: selectedCount })}
          </Text>

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressedSoft]}
            onPress={exitSelection}
          >
            <Text style={styles.cancelLabel}>{t.cancel}</Text>
          </Pressable>
        </View>
      ) : null}

      {filteredEvents.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsTitle}>{t.historyNoMatchTitle}</Text>
          <Text style={styles.noResultsSubtitle}>{t.historyNoMatchSubtitle}</Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.card,
              selecting && styles.cardWithActionBar,
            ]}
          >
            <FlatList
              style={styles.list}
              data={filteredEvents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              extraData={{ selecting, selectedIds, query }}
              renderItem={({ item, index }) => {
                const isSelected = selectedIds.has(item.id);
                const isLast = index === filteredEvents.length - 1;
                const zebra = index % 2 === 1;

                return (
                  <View>
                    <Pressable
                      style={[
                        styles.row,
                        zebra && styles.rowZebra,
                        selecting && isSelected && styles.rowSelected,
                      ]}
                      onPress={() => {
                        if (selecting) {
                          toggleSelection(item.id);
                          return;
                        }
                        onEventPress?.(item);
                      }}
                      onLongPress={() => {
                        if (!selecting) {
                          enterSelection(item.id);
                        }
                      }}
                      delayLongPress={350}
                    >
                      {selecting ? (
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected ? (
                            <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.info}>
                        <Text
                          style={[styles.date, selecting && isSelected && styles.dateSelected]}
                          numberOfLines={1}
                        >
                          {formatHistoryDate(item.triggeredAt, language)}
                        </Text>
                        <Text
                          style={[styles.title, selecting && isSelected && styles.titleSelected]}
                          numberOfLines={1}
                        >
                          {item.spotTitle}
                        </Text>
                      </View>

                      <Text
                        style={[styles.time, selecting && isSelected && styles.timeSelected]}
                        numberOfLines={1}
                      >
                        {formatHistoryTime(item.triggeredAt, language)}
                      </Text>
                    </Pressable>

                    {!isLast ? <View style={styles.divider} /> : null}
                  </View>
                );
              }}
            />
          </View>

          {selecting ? (
            <View style={styles.actionBar}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionItem,
                  selectedCount === 0 && styles.actionItemDisabled,
                  pressed && selectedCount > 0 && styles.pressedSoft,
                ]}
                onPress={handleDeleteSelected}
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
          ) : null}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 52,
  },
  selectAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 48,
    paddingVertical: spacing.xs,
  },
  selectAllCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectAllCircleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  selectAllLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
  },
  selectionCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  cancelBtn: {
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
  card: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardWithActionBar: {
    marginBottom: 96,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  rowZebra: {
    backgroundColor: colors.slate50,
  },
  rowSelected: {
    backgroundColor: colors.primaryLight,
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
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  date: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  dateSelected: {
    color: colors.slate500,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate600,
  },
  titleSelected: {
    color: colors.slate400,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
    marginStart: spacing.sm,
  },
  timeSelected: {
    color: colors.slate500,
  },
  pressedSoft: {
    opacity: 0.7,
  },
  actionBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xl,
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
