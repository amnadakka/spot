import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';

type EmptyStateProps = {
  onCreateFirst: () => void;
  /** When false, omit the primary CTA (e.g. mid sheet snap where it would clip). */
  showCta?: boolean;
};

export default function EmptyState({ onCreateFirst, showCta = true }: EmptyStateProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.iconCluster}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={44} color={colors.accent} />
        </View>
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={20} color={colors.onPrimary} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{t.emptyTitle}</Text>
        <Text style={styles.subtitle}>{t.emptySubtitle}</Text>
      </View>

      {showCta ? (
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onCreateFirst}
        >
          <Text style={styles.ctaLabel}>{t.emptyCta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    gap: spacing.xxl,
  },
  iconCluster: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: radii.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate800,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate400,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  cta: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaPressed: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
}));
