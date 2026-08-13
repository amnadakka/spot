import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetView,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
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

const SNAP_POINTS = ['22%', '48%', '90%'];
const SNAP_MINIMAL = 0;
const SNAP_MIDDLE = 1;
const SNAP_EXPANDED = 2;

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
  const { colors } = useTheme();
  const styles = useStyles();
  const sheetRef = useRef<BottomSheet>(null);
  const wasSelectingRef = useRef(false);
  const [snapIndex, setSnapIndex] = useState(SNAP_MIDDLE);
  const [selectionFooter, setSelectionFooter] = useState<SpotSelectionFooterState | null>(null);

  const activeCount = reminders.filter((reminder) => reminder.enabled).length;
  const subtitle =
    reminders.length > 0
      ? fill(t.activeOfTotal, { active: activeCount, total: reminders.length })
      : fill(t.upToActiveSpots, { count: MAX_ACTIVE_SPOTS });

  const handleSnapIndexChange = useCallback((index: number) => {
    if (index < 0) {
      return;
    }
    setSnapIndex(index);
  }, []);

  const handleAddPress = useCallback(() => {
    if (atSpotLimit) {
      Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
      return;
    }
    onAdd();
  }, [atSpotLimit, onAdd, t.spotLimitMessage, t.spotLimitTitle]);

  const handleSheetSelectionChange = useCallback((state: SpotSelectionFooterState | null) => {
    const isSelecting = state != null;
    if (!wasSelectingRef.current && isSelecting) {
      // Give selection UI room when starting from the minimal snap; footer stays
      // pinned if the user collapses again.
      sheetRef.current?.snapToIndex(SNAP_MIDDLE);
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

  const headerWithAdd = useMemo(
    () => (
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>{header}</View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            atSpotLimit && styles.addBtnDisabled,
            pressed && !atSpotLimit && styles.addBtnPressed,
          ]}
          onPress={handleAddPress}
          accessibilityLabel={t.addNewSpotA11y}
          accessibilityState={{ disabled: atSpotLimit }}
        >
          <Ionicons
            name="add"
            size={26}
            color={atSpotLimit ? colors.slate300 : colors.accent}
          />
        </Pressable>
      </View>
    ),
    [
      atSpotLimit,
      colors.accent,
      colors.slate300,
      handleAddPress,
      header,
      styles,
      t.addNewSpotA11y,
    ],
  );

  const showEmptyBody = snapIndex >= SNAP_MIDDLE;
  const showEmptyCta = snapIndex >= SNAP_EXPANDED;

  return (
    <BottomSheet
      ref={sheetRef}
      index={SNAP_MIDDLE}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose={false}
      topInset={8}
      footerComponent={renderFooter}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
      style={styles.sheet}
      onAnimate={(_fromIndex, toIndex) => handleSnapIndexChange(toIndex)}
      onChange={handleSnapIndexChange}
    >
      {reminders.length === 0 ? (
        <BottomSheetView style={styles.emptyContainer}>
          <View style={styles.emptyHeader}>{headerWithAdd}</View>
          {showEmptyBody ? (
            <View style={styles.emptyBody}>
              <EmptyState onCreateFirst={onAdd} showCta={showEmptyCta} />
            </View>
          ) : null}
        </BottomSheetView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
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
    backgroundColor: colors.primaryMuted,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnPressed: {
    opacity: 0.85,
  },
  emptyContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  emptyHeader: {
    paddingHorizontal: spacing.xl,
  },
  emptyBody: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
}));
