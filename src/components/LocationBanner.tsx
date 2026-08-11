import { Linking, Pressable, Text, View } from 'react-native';

import type { UserLocationStatus } from '../hooks/useUserLocation';
import { useI18n } from '../i18n/I18nContext';
import { makeStyles } from '../theme/makeStyles';
import { radii, spacing } from '../theme/spacing';

type LocationBannerProps = {
  status: UserLocationStatus;
};

export default function LocationBanner({ status }: LocationBannerProps) {
  const { t } = useI18n();
  const styles = useStyles();

  if (status.kind === 'loading' || status.kind === 'ok') {
    if (status.kind === 'ok' && status.backgroundGranted) {
      return null;
    }

    if (status.kind === 'ok' && !status.backgroundGranted) {
      return (
        <View style={[styles.banner, styles.warningBanner]}>
          <Text style={styles.warningText}>{t.backgroundLocationWarning}</Text>
          <SettingsLink />
        </View>
      );
    }

    return null;
  }

  let message = '';
  if (status.kind === 'services_disabled') {
    message = t.locationServicesOff;
  } else if (status.kind === 'foreground_denied') {
    message = t.locationPermissionDenied;
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
  const { t } = useI18n();
  const styles = useStyles();

  return (
    <Pressable onPress={() => Linking.openSettings()} style={styles.linkWrap}>
      <Text style={styles.link}>{t.openSettingsShort}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
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
    color: colors.accent,
  },
}));
