const fs = require('fs');
const path = require('path');

const {
  withAndroidManifest,
  withMainActivity,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');

const PATCH_MARKER = '// spot-geofence-alarm-fullscreen';

function addFullScreenIntentPermission(androidManifest) {
  AndroidConfig.Manifest.ensureToolsAvailable(androidManifest);
  const permissions = androidManifest.manifest['uses-permission'] ?? [];
  const hasPermission = permissions.some(
    (entry) => entry.$['android:name'] === 'android.permission.USE_FULL_SCREEN_INTENT',
  );

  if (!hasPermission) {
    permissions.push({
      $: { 'android:name': 'android.permission.USE_FULL_SCREEN_INTENT' },
    });
    androidManifest.manifest['uses-permission'] = permissions;
  }

  return androidManifest;
}

function addMainActivityLockScreenFlags(androidManifest) {
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);
  mainActivity.$['android:showWhenLocked'] = 'true';
  mainActivity.$['android:turnScreenOn'] = 'true';
  return androidManifest;
}

function patchMainActivityContents(contents) {
  if (contents.includes(PATCH_MARKER)) {
    return contents;
  }

  const onCreateNeedle = 'super.onCreate(null)';
  if (!contents.includes(onCreateNeedle)) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not find super.onCreate(null) in MainActivity.',
    );
  }

  const injection = `
    ${PATCH_MARKER}
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }`;

  return contents.replace(onCreateNeedle, `${onCreateNeedle}${injection}`);
}

function patchExpoNotificationBuilder(projectRoot) {
  const builderPath = path.join(
    projectRoot,
    'node_modules/expo-notifications/android/src/main/java/expo/modules/notifications/notifications/presentation/builders/ExpoNotificationBuilder.kt',
  );

  if (!fs.existsSync(builderPath)) {
    console.warn(
      '[withGeofenceAlarmFullScreen] ExpoNotificationBuilder.kt not found; skipping native alarm patch.',
    );
    return;
  }

  let contents = fs.readFileSync(builderPath, 'utf8');
  if (contents.includes(PATCH_MARKER)) {
    return;
  }

  const contentIntentNeedle = `    builder.setContentIntent(
      createNotificationResponseIntent(
        context,
        notification,
        defaultAction
      )
    )`;

  if (!contents.includes(contentIntentNeedle)) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not find setContentIntent block in ExpoNotificationBuilder.kt.',
    );
  }

  const fullScreenBlock = `${contentIntentNeedle}

    ${PATCH_MARKER}
    if (isGeofenceAlarmNotification(content)) {
      builder.setFullScreenIntent(
        createNotificationResponseIntent(
          context,
          notification,
          defaultAction
        ),
        true
      )
      builder.setCategory(NotificationCompat.CATEGORY_ALARM)
    }`;

  contents = contents.replace(contentIntentNeedle, fullScreenBlock);

  const companionNeedle = '  companion object {';
  const helperMethod = `  private fun isGeofenceAlarmNotification(content: INotificationContent): Boolean {
    return try {
      content.body?.optString("type") == "geofence_enter"
    } catch (_: Exception) {
      false
    }
  }

  ${companionNeedle}`;

  if (!contents.includes(companionNeedle)) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not find companion object in ExpoNotificationBuilder.kt.',
    );
  }

  contents = contents.replace(companionNeedle, helperMethod);

  if (!contents.includes('import expo.modules.notifications.notifications.interfaces.INotificationContent')) {
    contents = contents.replace(
      'import expo.modules.notifications.notifications.model.TextInputNotificationAction',
      'import expo.modules.notifications.notifications.interfaces.INotificationContent\nimport expo.modules.notifications.notifications.model.TextInputNotificationAction',
    );
  }

  fs.writeFileSync(builderPath, contents);
}

/**
 * Enables clock-style geofence alarms on Android:
 * - USE_FULL_SCREEN_INTENT permission
 * - MainActivity showWhenLocked / turnScreenOn
 * - Full-screen intent on geofence_enter notifications
 */
function withGeofenceAlarmFullScreen(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = addFullScreenIntentPermission(config.modResults);
    config.modResults = addMainActivityLockScreenFlags(config.modResults);
    return config;
  });

  config = withMainActivity(config, (config) => {
    config.modResults.contents = patchMainActivityContents(config.modResults.contents);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      patchExpoNotificationBuilder(config.modRequest.projectRoot);
      return config;
    },
  ]);

  return config;
}

module.exports = withGeofenceAlarmFullScreen;
