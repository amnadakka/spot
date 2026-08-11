import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n/I18nContext';
import { usePermissionStatuses } from '../hooks/usePermissionStatuses';
import { makeStyles } from '../theme/makeStyles';
import { radii, spacing } from '../theme/spacing';
import PermissionAccessRows from './settings/PermissionAccessRows';
import SettingsSection from './settings/SettingsSection';
import ScreenLayout from './ScreenLayout';

type OnboardingPermissionsScreenProps = {
  onComplete: () => void;
};

export default function OnboardingPermissionsScreen({
  onComplete,
}: OnboardingPermissionsScreenProps) {
  const { t } = useI18n();
  const permissions = usePermissionStatuses();
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <ScreenLayout>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.onboardingTitle}</Text>
          <Text style={styles.subtitle}>{t.onboardingSubtitle}</Text>
        </View>

        <View style={styles.body}>
          <SettingsSection title={t.sectionApplication}>
            <PermissionAccessRows
              notifications={permissions.notifications}
              location={permissions.location}
              onChanged={permissions.refresh}
            />
          </SettingsSection>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={onComplete}
          >
            <Text style={styles.ctaLabel}>{t.onboardingContinue}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenLayout>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.slate900,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate500,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.primaryDark,
  },
  ctaLabel: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
}));
