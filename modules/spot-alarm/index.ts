import { Platform } from 'react-native';

type SpotAlarmNativeModule = {
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): Promise<void>;
  getNativeDismissedAt(): number;
  consumeViewRegionId(): string | null;
  scheduleWindowOpen(
    regionId: string,
    triggerAt: number,
    title: string,
    text: string,
    body: string,
  ): boolean;
  cancelWindowOpen(regionId: string): void;
  cancelWindowOpenExcept(keepIds: string[]): void;
  consumePendingWindowOpen(): { regionIds: string[]; startedAt: number } | null;
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

export function scheduleWindowOpen(
  regionId: string,
  triggerAt: number,
  title: string,
  text: string,
  body: string,
): boolean {
  if (!native) {
    return false;
  }

  try {
    return Boolean(native.scheduleWindowOpen(regionId, triggerAt, title, text, body));
  } catch {
    return false;
  }
}

export function cancelWindowOpen(regionId: string): void {
  if (!native) {
    return;
  }

  try {
    native.cancelWindowOpen(regionId);
  } catch {
    // Ignore missing native bindings in Expo Go / web.
  }
}

export function cancelWindowOpenExcept(keepIds: string[]): void {
  if (!native) {
    return;
  }

  try {
    native.cancelWindowOpenExcept(keepIds);
  } catch {
    // Ignore missing native bindings in Expo Go / web.
  }
}

export function consumePendingWindowOpen(): { regionIds: string[]; startedAt: number } | null {
  if (!native) {
    return null;
  }

  try {
    const pending = native.consumePendingWindowOpen();
    if (!pending || !Array.isArray(pending.regionIds) || pending.regionIds.length === 0) {
      return null;
    }
    return {
      regionIds: pending.regionIds.filter((id): id is string => typeof id === 'string'),
      startedAt: Number(pending.startedAt) || 0,
    };
  } catch {
    return null;
  }
}

export function isSpotAlarmNativeAvailable(): boolean {
  return native != null;
}
