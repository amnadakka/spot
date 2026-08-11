import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n/I18nContext';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';

export type Tab = 'home' | 'calendar' | 'history' | 'text' | 'settings';

type BottomNavProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const styles = useStyles();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <NavItem
        label={t.tabHome}
        icon="home"
        active={activeTab === 'home'}
        onPress={() => onTabChange('home')}
      />
      <NavItem
        label={t.tabCalendar}
        icon="calendar-outline"
        active={activeTab === 'calendar'}
        onPress={() => onTabChange('calendar')}
      />
      <NavItem
        label={t.tabHistory}
        icon="time-outline"
        active={activeTab === 'history'}
        onPress={() => onTabChange('history')}
      />
      <NavItem
        label={t.tabText}
        icon="chatbubble-ellipses-outline"
        active={activeTab === 'text'}
        onPress={() => onTabChange('text')}
      />
      <NavItem
        label={t.settingsTitle}
        icon="settings-outline"
        active={activeTab === 'settings'}
        onPress={() => onTabChange('settings')}
      />
    </View>
  );
}

function NavItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? colors.accent : colors.slate400} />
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: 'row',
    minHeight: 72,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.accent,
  },
  labelInactive: {
    color: colors.slate400,
  },
}));
