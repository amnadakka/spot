import { Platform } from 'react-native';

type SpotAlarmNativeModule = {
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): Promise<void>;
  getNativeDismissedAt(): number;
  consumeViewRegionId(): string | null;
};

function loadNativeModule(): SpotAlarmNativeModule | null {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (name: string) => SpotAlarmNativeModule | null;
    };
    return requireOptionalNativeModule('SpotAlarm');
  } catch {
    return null;
  }
}

const native = loadNativeModule();

export function canUseFullScreenIntent(): boolean {
  if (!native) {
    return true;
  }

  try {
    return native.canUseFullScreenIntent();
  } catch {
    return true;
  }
}

export async function openFullScreenIntentSettings(): Promise<void> {
  if (!native) {
    return;
  }

  await native.openFullScreenIntentSettings();
}

export function getNativeDismissedAt(): number {
  if (!native) {
    return 0;
  }

  try {
    return native.getNativeDismissedAt() || 0;
  } catch {
    return 0;
  }
}

export function consumeViewRegionId(): string | null {
  if (!native) {
    return null;
  }

  try {
    return native.consumeViewRegionId();
  } catch {
    return null;
  }
}

export function isSpotAlarmNativeAvailable(): boolean {
  return native != null;
}
