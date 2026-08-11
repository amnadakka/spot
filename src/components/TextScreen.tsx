import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { fill } from '../i18n/translations';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';
import type { Reminder } from '../types/reminder';

type TextScreenProps = {
  reminders: Reminder[];
};

function formatReminderText(
  reminder: Reminder,
  nearbyTemplate: string,
  withDescriptionTemplate: string,
): string {
  const title = reminder.title.trim();
  const description = reminder.description?.trim();

  if (description) {
    return fill(withDescriptionTemplate, { title, description });
  }

  return fill(nearbyTemplate, { title });
}

export default function TextScreen({ reminders }: TextScreenProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();

  const activeReminders = useMemo(
    () => reminders.filter((reminder) => reminder.enabled),
    [reminders],
  );

  if (activeReminders.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.accent} />
        </View>
        <Text style={styles.emptyTitle}>{t.textEmptyTitle}</Text>
        <Text style={styles.emptySubtitle}>{t.textEmptySubtitle}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activeReminders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardText}>
            {formatReminderText(
              item,
              t.textRemindNearby,
              t.textRemindNearbyWithDescription,
            )}
          </Text>
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.foreground,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.xxl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
}));
