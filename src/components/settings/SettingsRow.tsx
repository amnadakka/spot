import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n/I18nContext';
import { makeStyles } from '../../theme/makeStyles';
import { useTheme } from '../../theme/ThemeContext';
import { radii, spacing } from '../../theme/spacing';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  label: string;
  value?: string;
  showChevron?: boolean;
  onPress: () => void;
  isLast?: boolean;
};

export default function SettingsRow({
  icon,
  iconColor,
  iconBackground,
  label,
  value,
  showChevron = true,
  onPress,
  isLast = false,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const { isRTL } = useI18n();
  const styles = useStyles();

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>

      <View style={[styles.content, !isLast && styles.contentBorder]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.trailing}>
          {value ? <Text style={styles.value}>{value}</Text> : null}
          {showChevron ? (
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={colors.slate300}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: spacing.lg,
    minHeight: 56,
  },
  rowPressed: {
    backgroundColor: colors.slate50,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingEnd: spacing.lg,
    gap: spacing.sm,
  },
  contentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.slate900,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: 15,
    color: colors.slate400,
  },
}));
