import { Platform } from 'react-native';

import {
  canUseFullScreenIntent,
  consumeViewRegionId,
  getNativeDismissedAt,
  isSpotAlarmNativeAvailable,
  openFullScreenIntentSettings,
} from '../../modules/spot-alarm';

export {
  canUseFullScreenIntent,
  consumeViewRegionId,
  getNativeDismissedAt,
  isSpotAlarmNativeAvailable,
  openFullScreenIntentSettings,
};

export function wasAlarmDismissedNatively(startedAt: number): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const dismissedAt = getNativeDismissedAt();
  return dismissedAt > 0 && dismissedAt >= startedAt - 2000;
}
