import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  count?: number;
  showBack?: boolean;
  onBack?: () => void;
};

export default function AppHeader({ title, subtitle, count, showBack, onBack }: AppHeaderProps) {
  const { t, isRTL } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={onBack}
          accessibilityLabel={t.goBack}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={18}
            color={colors.slate600}
          />
        </Pressable>
      ) : null}

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {count !== undefined && count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      ) : (
        <View style={styles.badgePlaceholder} />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -4,
  },
  backBtnPressed: {
    backgroundColor: colors.slate200,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  badgePlaceholder: {
    width: 36,
  },
}));
