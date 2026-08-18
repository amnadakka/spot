package expo.modules.spotalarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SpotAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SpotAlarm")

    Function("canUseFullScreenIntent") {
      val context = androidContext() ?: return@Function true
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@Function true
      }
      val manager = context.getSystemService(NotificationManager::class.java)
      manager?.canUseFullScreenIntent() ?: true
    }

    AsyncFunction("openFullScreenIntentSettings") {
      val context = androidContext() ?: return@AsyncFunction null
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        return@AsyncFunction null
      }
      val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(intent)
      } catch (_: Exception) {
        val fallback = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
          putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(fallback)
      }
    }

    Function("getNativeDismissedAt") {
      val context = androidContext() ?: return@Function 0.0
      SpotAlarmStore.getDismissedAt(context).toDouble()
    }

    Function("consumeViewRegionId") {
      val context = androidContext() ?: return@Function null
      SpotAlarmStore.consumeViewRegionId(context)
    }

    Function("scheduleWindowOpen") { regionId: String, triggerAt: Double, title: String, text: String, body: String ->
      val context = androidContext() ?: return@Function false
      WindowOpenAlarmScheduler.schedule(context, regionId, triggerAt.toLong(), title, text, body)
    }

    Function("cancelWindowOpen") { regionId: String ->
      val context = androidContext() ?: return@Function null
      WindowOpenAlarmScheduler.cancel(context, regionId)
    }

    Function("cancelWindowOpenExcept") { keepIds: List<String> ->
      val context = androidContext() ?: return@Function null
      WindowOpenAlarmScheduler.cancelExcept(context, keepIds.toSet())
    }

    Function("consumePendingWindowOpen") {
      val context = androidContext() ?: return@Function null
      val pending = SpotAlarmStore.consumePendingAlarm(context) ?: return@Function null
      mapOf(
        "regionIds" to pending.first,
        "startedAt" to pending.second.toDouble(),
      )
    }
  }

  private fun androidContext(): android.content.Context? {
    return appContext.reactContext ?: appContext.currentActivity
  }
}
