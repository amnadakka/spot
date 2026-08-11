import BottomSheet, {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { radii, spacing } from '../theme/spacing';
import { MAX_ACTIVE_SPOTS, type Reminder } from '../types/reminder';

import EmptyState from './EmptyState';
import SpotList, {
  SpotSelectionActionBar,
  type SpotSelectionFooterState,
} from './SpotList';

type HomeSpotsSheetProps = {
  reminders: Reminder[];
  occupiedSpotIds: Set<string>;
  atSpotLimit: boolean;
  onToggle: (id: string) => void;
  onSetEnabledMany: (ids: string[], enabled: boolean) => void;
  onDeleteMany: (ids: string[]) => void;
  onAdd: () => void;
  onSpotPress: (id: string) => void;
};

const SNAP_POINTS = ['20%', '48%', '90%'];

export default function HomeSpotsSheet({
  reminders,
  occupiedSpotIds,
  atSpotLimit,
  onToggle,
  onSetEnabledMany,
  onDeleteMany,
  onAdd,
  onSpotPress,
}: HomeSpotsSheetProps) {
  const { t } = useI18n();
  const styles = useStyles();
  const sheetRef = useRef<BottomSheet>(null);
  const wasSelectingRef = useRef(false);
  const [selectionFooter, setSelectionFooter] = useState<SpotSelectionFooterState | null>(null);

  const activeCount = reminders.filter((reminder) => reminder.enabled).length;
  const subtitle =
    reminders.length > 0
      ? fill(t.activeOfTotal, { active: activeCount, total: reminders.length })
      : fill(t.upToActiveSpots, { count: MAX_ACTIVE_SPOTS });

  const handleSheetSelectionChange = useCallback((state: SpotSelectionFooterState | null) => {
    const isSelecting = state != null;
    if (!wasSelectingRef.current && isSelecting) {
      // Give selection UI room when starting from the minimal snap; footer stays
      // pinned if the user collapses again.
      sheetRef.current?.snapToIndex(1);
    }
    wasSelectingRef.current = isSelecting;
    setSelectionFooter(state);
  }, []);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (!selectionFooter) {
        return null;
      }
      return (
        <BottomSheetFooter {...props} bottomInset={spacing.lg}>
          <SpotSelectionActionBar {...selectionFooter} floating={false} />
        </BottomSheetFooter>
      );
    },
    [selectionFooter],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.spotsTitle}</Text>
          {reminders.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{reminders.length}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    ),
    [reminders.length, styles, subtitle, t.spotsTitle],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={1}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      topInset={8}
      footerComponent={renderFooter}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
      style={styles.sheet}
    >
      {reminders.length === 0 ? (
        <BottomSheetScrollView contentContainerStyle={styles.emptyScroll}>
          <View style={styles.emptyHeader}>{header}</View>
          <EmptyState onCreateFirst={onAdd} />
        </BottomSheetScrollView>
      ) : (
        <SpotList
          reminders={reminders}
          onToggle={onToggle}
          onSetEnabledMany={onSetEnabledMany}
          onDeleteMany={onDeleteMany}
          onAdd={onAdd}
          onSpotPress={onSpotPress}
          addDisabled={atSpotLimit}
          occupiedSpotIds={occupiedSpotIds}
          sheetMode
          sheetHeader={header}
          onSheetSelectionChange={handleSheetSelectionChange}
        />
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles((colors) => ({
  sheet: {
    zIndex: 2,
  },
  background: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
  },
  handle: {
    backgroundColor: colors.slate300,
    width: 40,
  },
  header: {
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    fontSize: 28,
    fontWeight: '800',
    color: colors.slate900,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.slate400,
    marginTop: 4,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate600,
  },
  emptyScroll: {
    paddingBottom: spacing.xxl,
  },
  emptyHeader: {
    paddingHorizontal: spacing.xl,
  },
}));
