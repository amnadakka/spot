import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../../i18n/I18nContext';
import { makeStyles } from '../../theme/makeStyles';
import { radii, spacing } from '../../theme/spacing';

type InfoBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  body?: string;
  children?: ReactNode;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export default function InfoBottomSheet({
  visible,
  onClose,
  icon,
  iconColor,
  iconBackground,
  title,
  body,
  children,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
}: InfoBottomSheetProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t.dismiss} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.handle} />

          <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
            <Ionicons name={icon} size={32} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {children}

          {primaryLabel ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={onPrimaryPress}
            >
              <Text style={styles.primaryLabel}>{primaryLabel}</Text>
            </Pressable>
          ) : null}

          {secondaryLabel ? (
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
              onPress={onSecondaryPress ?? onClose}
            >
              <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate300,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.slate500,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryLabel: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnPressed: {
    opacity: 0.7,
  },
  secondaryLabel: {
    color: colors.slate500,
    fontSize: 14,
    fontWeight: '500',
  },
}));
