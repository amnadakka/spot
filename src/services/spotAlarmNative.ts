import { Platform } from 'react-native';

import {
  canUseFullScreenIntent,
  cancelWindowOpen,
  cancelWindowOpenExcept,
  consumePendingWindowOpen,
  consumeViewRegionId,
  getNativeDismissedAt,
  isSpotAlarmNativeAvailable,
  openFullScreenIntentSettings,
  scheduleWindowOpen,
} from '../../modules/spot-alarm';

export {
  canUseFullScreenIntent,
  cancelWindowOpen,
  cancelWindowOpenExcept,
  consumePendingWindowOpen,
  consumeViewRegionId,
  getNativeDismissedAt,
  isSpotAlarmNativeAvailable,
  openFullScreenIntentSettings,
  scheduleWindowOpen,
};

export function wasAlarmDismissedNatively(startedAt: number): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const dismissedAt = getNativeDismissedAt();
  return dismissedAt > 0 && dismissedAt >= startedAt - 2000;
}
