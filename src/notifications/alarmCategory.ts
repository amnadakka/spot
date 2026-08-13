import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { getT } from '../i18n/translations';

import {
  GEOFENCE_ALARM_ACTION_DISMISS,
  GEOFENCE_ALARM_ACTION_VIEW,
  GEOFENCE_ALARM_CATEGORY_ID,
} from './constants';

export async function ensureGeofenceAlarmCategory(): Promise<void> {
  if (isExpoGoAndroid()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const t = getT();

  await Notifications.setNotificationCategoryAsync(GEOFENCE_ALARM_CATEGORY_ID, [
    {
      identifier: GEOFENCE_ALARM_ACTION_VIEW,
      buttonTitle: t.viewSpot,
      options: { opensAppToForeground: true },
    },
    {
      identifier: GEOFENCE_ALARM_ACTION_DISMISS,
      buttonTitle: t.dismiss,
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]);
}
