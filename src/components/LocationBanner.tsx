import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserLocationStatus } from '../hooks/useUserLocation';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';

type LocationBannerProps = {
  status: UserLocationStatus;
};

export default function LocationBanner({ status }: LocationBannerProps) {
  if (status.kind === 'loading' || status.kind === 'ok') {
    if (status.kind === 'ok' && status.backgroundGranted) {
      return null;
    }

    if (status.kind === 'ok' && !status.backgroundGranted) {
      return (
        <View style={[styles.banner, styles.warningBanner]}>
          <Text style={styles.warningText}>
            Background location wasn't granted. Nearby reminders may not work when the app isn't
            open.
          </Text>
          <SettingsLink />
        </View>
      );
    }

    return null;
  }

  let message = '';
  if (status.kind === 'services_disabled') {
    message = 'Location services are turned off on this device.';
  } else if (status.kind === 'foreground_denied') {
    message =
      'Location permission was denied. Allow location access to save spots and get nearby alerts.';
  } else if (status.kind === 'position_error') {
    message = status.message;
  }

  return (
    <View style={[styles.banner, styles.warningBanner]}>
      <Text style={styles.warningText}>{message}</Text>
      {status.kind !== 'position_error' ? <SettingsLink /> : null}
    </View>
  );
}

function SettingsLink() {
  return (
    <Pressable onPress={() => Linking.openSettings()} style={styles.linkWrap}>
      <Text style={styles.link}>Open settings</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  warningBanner: {
    backgroundColor: colors.warningBg,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  linkWrap: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
