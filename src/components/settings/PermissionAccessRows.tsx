import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { useI18n } from '../../i18n/I18nContext';
import {
  type FullScreenIntentStatus,
  type LocationPermissionStatus,
  type NotificationPermissionStatus,
} from '../../hooks/usePermissionStatuses';
import { requestNotificationPermissionsAsync } from '../../notifications/configureNotifications';
import { requestForegroundThenBackgroundPermissions } from '../../services/locationPermissions';
import { openFullScreenIntentSettings } from '../../services/spotAlarmNative';
import InfoBottomSheet from './InfoBottomSheet';
import SettingsRow from './SettingsRow';

type PermissionAccessRowsProps = {
  notifications: NotificationPermissionStatus;
  location: LocationPermissionStatus;
  fullScreenIntent: FullScreenIntentStatus;
  onChanged: () => void;
  locationIsLast?: boolean;
};

export function notificationStatusLabel(
  status: NotificationPermissionStatus,
  t: ReturnType<typeof useI18n>['t'],
): string {
  return status === 'granted' ? t.statusEnabled : t.statusDisabled;
}

export function locationStatusLabel(
  status: LocationPermissionStatus,
  t: ReturnType<typeof useI18n>['t'],
): string {
  switch (status) {
    case 'always':
      return t.statusAlways;
    case 'while_in_use':
      return t.statusWhileInUse;
    case 'denied':
      return t.statusDenied;
    default:
      return t.statusOff;
  }
}

export default function PermissionAccessRows({
  notifications,
  location,
  fullScreenIntent,
  onChanged,
  locationIsLast = true,
}: PermissionAccessRowsProps) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState<'notifications' | 'location' | 'fullScreen' | null>(null);

  const notificationsGranted = notifications === 'granted';
  const locationGranted = location === 'always' || location === 'while_in_use';
  const notificationsNeedsSettings = notifications === 'denied';
  const locationNeedsSettings = location === 'denied';
  const showFullScreenRow = Platform.OS === 'android' && fullScreenIntent !== 'unsupported';
  const fullScreenGranted = fullScreenIntent === 'granted';

  async function handleEnableNotifications() {
    if (notificationsNeedsSettings) {
      await Linking.openSettings();
      setSheet(null);
      return;
    }

    await requestNotificationPermissionsAsync();
    onChanged();
    setSheet(null);
  }

  async function handleEnableLocation() {
    if (locationNeedsSettings) {
      await Linking.openSettings();
      setSheet(null);
      return;
    }

    await requestForegroundThenBackgroundPermissions();
    onChanged();
    setSheet(null);
  }

  return (
    <>
      <SettingsRow
        icon="notifications"
        iconColor="#EF4444"
        iconBackground="#FEE2E2"
        label={t.notifications}
        value={notificationStatusLabel(notifications, t)}
        onPress={() => setSheet('notifications')}
      />
      {showFullScreenRow ? (
        <SettingsRow
          icon="phone-portrait"
          iconColor="#F59E0B"
          iconBackground="#FEF3C7"
          label={t.fullScreenAlarms}
          value={fullScreenGranted ? t.statusEnabled : t.statusDisabled}
          onPress={() => setSheet('fullScreen')}
        />
      ) : null}
      <SettingsRow
        icon="location"
        iconColor="#3B82F6"
        iconBackground="#DBEAFE"
        label={t.locationAccess}
        value={locationStatusLabel(location, t)}
        onPress={() => setSheet('location')}
        isLast={locationIsLast}
      />

      <InfoBottomSheet
        visible={sheet === 'notifications'}
        onClose={() => setSheet(null)}
        icon="notifications"
        iconColor="#EF4444"
        iconBackground="#FEE2E2"
        title={t.notificationsSheetTitle}
        body={t.notificationsSheetBody}
        primaryLabel={notificationsNeedsSettings || notificationsGranted ? t.openSettings : t.enable}
        onPrimaryPress={() => {
          if (notificationsGranted) {
            void Linking.openSettings().then(() => setSheet(null));
            return;
          }
          void handleEnableNotifications();
        }}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      />

      <InfoBottomSheet
        visible={sheet === 'location'}
        onClose={() => setSheet(null)}
        icon="location"
        iconColor="#3B82F6"
        iconBackground="#DBEAFE"
        title={t.locationSheetTitle}
        body={t.locationSheetBody}
        primaryLabel={locationNeedsSettings || locationGranted ? t.openSettings : t.enable}
        onPrimaryPress={() => {
          if (locationGranted) {
            void Linking.openSettings().then(() => setSheet(null));
            return;
          }
          void handleEnableLocation();
        }}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      />

      <InfoBottomSheet
        visible={sheet === 'fullScreen'}
        onClose={() => setSheet(null)}
        icon="phone-portrait"
        iconColor="#F59E0B"
        iconBackground="#FEF3C7"
        title={t.fullScreenAlarmsSheetTitle}
        body={t.fullScreenAlarmsSheetBody}
        primaryLabel={t.openSettings}
        onPrimaryPress={() => {
          void openFullScreenIntentSettings().finally(() => {
            onChanged();
            setSheet(null);
          });
        }}
        secondaryLabel={t.close}
        onSecondaryPress={() => setSheet(null)}
      />
    </>
  );
}
