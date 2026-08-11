import { StyleSheet, Text, View } from 'react-native';

import { makeStyles } from '../../theme/makeStyles';
import { radii, spacing } from '../../theme/spacing';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

export default function SettingsSection({ title, children }: SettingsSectionProps) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  section: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.slate400,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
}));
