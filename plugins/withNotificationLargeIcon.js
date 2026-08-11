const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');

const META_DATA_LARGE_ICON = 'expo.modules.notifications.large_notification_icon';
const LARGE_ICON_NAME = 'notification_large_icon';
const LARGE_ICON_RESOURCE = `@drawable/${LARGE_ICON_NAME}`;
const ANDROID_RES_PATH = 'android/app/src/main/res/';
const BASELINE_PIXEL_SIZE = 64;

const dpiValues = {
  mdpi: { folderName: 'drawable-mdpi', scale: 1 },
  hdpi: { folderName: 'drawable-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'drawable-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'drawable-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'drawable-xxxhdpi', scale: 4 },
};

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
} = AndroidConfig.Manifest;

/**
 * Registers the colorful app icon as Android's notification large icon
 * (shown in the shade next to title/body). Expo's notifications plugin only
 * configures the monochrome small/status-bar icon today.
 */
function withNotificationLargeIcon(config, { icon } = {}) {
  const iconPath = icon || './assets/notification-large-icon.png';

  config = withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);
    addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_LARGE_ICON,
      LARGE_ICON_RESOURCE,
      'resource',
    );
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      await Promise.all(
        Object.values(dpiValues).map(async ({ folderName, scale }) => {
          const dpiFolderPath = resolve(projectRoot, ANDROID_RES_PATH, folderName);
          if (!existsSync(dpiFolderPath)) {
            mkdirSync(dpiFolderPath, { recursive: true });
          }

          const size = Math.round(BASELINE_PIXEL_SIZE * scale);
          const { source } = await generateImageAsync(
            { projectRoot, cacheType: 'android-notification-large' },
            {
              src: iconPath,
              width: size,
              height: size,
              resizeMode: 'cover',
              backgroundColor: 'transparent',
            },
          );
          writeFileSync(resolve(dpiFolderPath, `${LARGE_ICON_NAME}.png`), source);
        }),
      );
      return config;
    },
  ]);

  return config;
}

module.exports = withNotificationLargeIcon;
