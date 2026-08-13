import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n/I18nContext';
import { loadHistory } from '../storage/history';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { HistoryEvent } from '../types/history';
import { timeAgo } from '../utils/timeAgo';

import ConfirmDialog from './ui/ConfirmDialog';

type HistoryScreenProps = {
  refreshKey?: number;
  onEventPress?: (event: HistoryEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  /** @deprecated Bulk delete UI removed; kept for call-site compatibility. */
  onDeleteEvents?: (eventIds: string[]) => void;
};

export default function HistoryScreen({
  refreshKey = 0,
  onEventPress,
  onDeleteEvent,
}: HistoryScreenProps) {
  const { t, language } = useI18n();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuEvent, setMenuEvent] = useState<HistoryEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEvent | null>(null);

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

  const closeMenu = useCallback(() => setMenuEvent(null), []);

  const handleOpenFromMenu = useCallback(() => {
    if (!menuEvent) {
      return;
    }
    const event = menuEvent;
    setMenuEvent(null);
    onEventPress?.(event);
  }, [menuEvent, onEventPress]);

  const handleDeleteFromMenu = useCallback(() => {
    if (!menuEvent) {
      return;
    }
    setDeleteTarget(menuEvent);
    setMenuEvent(null);
  }, [menuEvent]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) {
      return;
    }
    const id = deleteTarget.id;
    setEvents((prev) => prev.filter((event) => event.id !== id));
    onDeleteEvent?.(id);
    setDeleteTarget(null);
  }, [deleteTarget, onDeleteEvent]);

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
      <FlatList
        style={styles.list}
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isLast = index === events.length - 1;
          const address = item.address?.trim();

          return (
            <View>
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
                  onPress={() => onEventPress?.(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.spotTitle}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name="location" size={18} color={colors.accent} />
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.spotTitle}
                    </Text>
                    {address ? (
                      <Text style={styles.address} numberOfLines={1}>
                        {address}
                      </Text>
                    ) : null}
                    <Text style={styles.meta} numberOfLines={1}>
                      {timeAgo(item.triggeredAt, language)}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
                  onPress={() => setMenuEvent(item)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t.moreOptions}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.slate500} />
                </Pressable>
              </View>

              {!isLast ? <View style={styles.divider} /> : null}
            </View>
          );
        }}
      />

      <Modal
        visible={menuEvent != null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.menuRoot}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
          />
          <View style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={styles.menuHandle} />
            {menuEvent ? (
              <Text style={styles.menuTitle} numberOfLines={1}>
                {menuEvent.spotTitle}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.menuAction, pressed && styles.menuActionPressed]}
              onPress={handleOpenFromMenu}
              accessibilityRole="button"
              accessibilityLabel={t.viewSpot}
            >
              <Ionicons name="open-outline" size={20} color={colors.slate800} />
              <Text style={styles.menuActionLabel}>{t.viewSpot}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuAction, pressed && styles.menuActionPressed]}
              onPress={handleDeleteFromMenu}
              accessibilityRole="button"
              accessibilityLabel={t.deleteHistoryEntryA11y}
            >
              <Ionicons name="trash-outline" size={20} color={colors.destructive} />
              <Text style={[styles.menuActionLabel, styles.menuActionDestructive]}>{t.delete}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuAction,
                styles.menuCancel,
                pressed && styles.menuActionPressed,
              ]}
              onPress={closeMenu}
              accessibilityRole="button"
              accessibilityLabel={t.cancel}
            >
              <Text style={styles.menuCancelLabel}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteTarget != null}
        title={t.deleteHistoryTitle}
        message={t.deleteHistoryConfirmOne}
        cancelLabel={t.cancel}
        confirmLabel={t.delete}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  list: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 0,
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  address: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  meta: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 1,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnPressed: {
    backgroundColor: colors.slate100,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginStart: spacing.lg + 40 + spacing.md,
  },
  menuRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  menuSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  menuHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate300,
    marginBottom: spacing.sm,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate500,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  menuAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  menuActionPressed: {
    backgroundColor: colors.slate50,
  },
  menuActionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
  },
  menuActionDestructive: {
    color: colors.destructive,
  },
  menuCancel: {
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  menuCancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate500,
    textAlign: 'center',
    width: '100%',
  },
}));
