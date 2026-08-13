const fs = require('fs');
const path = require('path');

const {
  withAndroidManifest,
  withMainActivity,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');

const PATCH_MARKER = '// spot-geofence-alarm-fullscreen';
const ALARM_ACTIVITY = 'expo.modules.spotalarm.AlarmActivity';
const DISMISS_RECEIVER = 'expo.modules.spotalarm.AlarmDismissReceiver';

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
    console.warn(
      '[withGeofenceAlarmFullScreen] Could not find super.onCreate(null) in MainActivity.',
    );
    return contents;
  }

  const injection = `
    ${PATCH_MARKER}
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }`;

  return contents.replace(onCreateNeedle, `${onCreateNeedle}${injection}`);
}

function ensureImport(contents, importLine) {
  if (contents.includes(importLine)) {
    return contents;
  }

  const packageMatch = contents.match(/^package .+$/m);
  if (!packageMatch) {
    return `${importLine}\n${contents}`;
  }

  return contents.replace(packageMatch[0], `${packageMatch[0]}\n${importLine}`);
}

function injectHelperMethods(contents) {
  if (contents.includes('fun applyGeofenceAlarmFullScreen')) {
    return contents;
  }

  const helper = `
  private fun isGeofenceAlarmNotification(content: INotificationContent): Boolean {
    return try {
      content.body?.optString("type") == "geofence_enter"
    } catch (_: Exception) {
      false
    }
  }

  private fun applyGeofenceAlarmFullScreen(
    builder: NotificationCompat.Builder,
    content: INotificationContent
  ) {
    ${PATCH_MARKER}
    if (!isGeofenceAlarmNotification(content)) {
      return
    }

    try {
      val activityClass = Class.forName("${ALARM_ACTIVITY}")
      val extrasBody = content.body?.toString()
      val fullScreenIntent = android.content.Intent(context, activityClass).apply {
        flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
          android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or
          android.content.Intent.FLAG_ACTIVITY_NO_USER_ACTION
        putExtra("title", content.title)
        putExtra("text", content.text)
        putExtra("body", extrasBody)
      }
      val flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
      val requestCode = (content.body?.optString("regionId") ?: "geofence").hashCode()
      builder.setFullScreenIntent(
        android.app.PendingIntent.getActivity(context, requestCode, fullScreenIntent, flags),
        true
      )
      builder.setCategory(NotificationCompat.CATEGORY_ALARM)
      builder.setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

      val dismissLabel = content.body?.optString("dismissLabel")?.takeIf { it.isNotEmpty() } ?: "Dismiss"
      val viewSpotLabel = content.body?.optString("viewSpotLabel")?.takeIf { it.isNotEmpty() } ?: "View spot"
      val dismissClass = Class.forName("${DISMISS_RECEIVER}")
      val dismissIntent = android.content.Intent(context, dismissClass)
      builder.addAction(
        0,
        dismissLabel,
        android.app.PendingIntent.getBroadcast(context, requestCode + 1, dismissIntent, flags)
      )
      builder.addAction(
        0,
        viewSpotLabel,
        android.app.PendingIntent.getActivity(context, requestCode + 2, fullScreenIntent, flags)
      )
    } catch (error: Exception) {
      android.util.Log.w("expo-notifications", "Could not attach geofence full-screen intent", error)
    }
  }

`;

  const companionNeedle = '  companion object {';
  if (contents.includes(companionNeedle)) {
    return contents.replace(companionNeedle, `${helper}  ${companionNeedle}`);
  }

  const classClose = contents.lastIndexOf('}');
  if (classClose === -1) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not insert geofence alarm helpers into ExpoNotificationBuilder.kt.',
    );
  }

  return `${contents.slice(0, classClose)}${helper}${contents.slice(classClose)}`;
}

function injectFullScreenCall(contents) {
  if (contents.includes('applyGeofenceAlarmFullScreen(builder, content)')) {
    return contents;
  }

  const call = `
    applyGeofenceAlarmFullScreen(builder, content)
`;

  const contentIntentRegex =
    /builder\.setContentIntent\(\s*createNotificationResponseIntent\([\s\S]*?\)\s*\)/;
  if (contentIntentRegex.test(contents)) {
    return contents.replace(contentIntentRegex, (match) => `${match}\n${call}`);
  }

  const fallbackNeedle = 'builder.setContentIntent(';
  const index = contents.indexOf(fallbackNeedle);
  if (index === -1) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not find setContentIntent in ExpoNotificationBuilder.kt.',
    );
  }

  const afterCall = contents.indexOf('\n', contents.indexOf(')', index));
  if (afterCall === -1) {
    throw new Error(
      '[withGeofenceAlarmFullScreen] Could not insert full-screen intent call after setContentIntent.',
    );
  }

  return `${contents.slice(0, afterCall + 1)}${call}${contents.slice(afterCall + 1)}`;
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
  if (contents.includes(PATCH_MARKER) && contents.includes('applyGeofenceAlarmFullScreen(builder, content)')) {
    return;
  }

  contents = ensureImport(
    contents,
    'import expo.modules.notifications.notifications.interfaces.INotificationContent',
  );
  contents = injectHelperMethods(contents);
  contents = injectFullScreenCall(contents);

  fs.writeFileSync(builderPath, contents);
}

/**
 * Enables clock-style geofence alarms on Android:
 * - USE_FULL_SCREEN_INTENT permission
 * - MainActivity showWhenLocked / turnScreenOn
 * - Full-screen intent + Dismiss / View spot actions on geofence_enter notifications
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
