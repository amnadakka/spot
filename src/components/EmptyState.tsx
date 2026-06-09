import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

type EmptyStateProps = {
  onCreateFirst: () => void;
};

export default function EmptyState({ onCreateFirst }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCluster}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={44} color={colors.primary} />
        </View>
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={20} color={colors.surface} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>No upcoming spot alarms</Text>
        <Text style={styles.subtitle}>
          Save a location and get notified when you're nearby.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={onCreateFirst}
      >
        <Text style={styles.ctaLabel}>Create your first spot</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
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
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
