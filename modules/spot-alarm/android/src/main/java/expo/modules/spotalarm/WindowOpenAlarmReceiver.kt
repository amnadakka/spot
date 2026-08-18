package expo.modules.spotalarm

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

class WindowOpenAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    val regionId = intent?.getStringExtra(WindowOpenAlarmScheduler.EXTRA_REGION_ID) ?: return
    val payload = WindowOpenAlarmScheduler.readPayload(context, regionId) ?: return
    WindowOpenAlarmScheduler.removePayload(context, regionId)

    val title = payload.optString("title").ifBlank { "Spot Alarm" }
    val text = payload.optString("text")
    val bodyRaw = payload.optString("body")
    val body = AlarmActivity.parseBody(bodyRaw)
    val startedAt = body.optLong("batchStartedAt", System.currentTimeMillis())
    val regionIds = AlarmActivity.regionIdsFromBody(body).ifEmpty { listOf(regionId) }

    SpotAlarmStore.setPendingAlarm(context, regionIds, startedAt)
    postAlarmNotification(context, regionId, title, text, bodyRaw, body)
  }

  private fun postAlarmNotification(
    context: Context,
    regionId: String,
    title: String,
    text: String,
    bodyRaw: String,
    body: JSONObject,
  ) {
    val requestCode = regionId.hashCode()
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

    val fullScreenIntent = Intent(context, AlarmActivity::class.java).apply {
      this.flags = Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_NO_USER_ACTION
      putExtra(AlarmActivity.EXTRA_TITLE, title)
      putExtra(AlarmActivity.EXTRA_TEXT, text)
      putExtra(AlarmActivity.EXTRA_BODY, bodyRaw)
    }
    val fullScreenPending = PendingIntent.getActivity(context, requestCode, fullScreenIntent, flags)

    val dismissPending = PendingIntent.getBroadcast(
      context,
      requestCode + 1,
      Intent(context, AlarmDismissReceiver::class.java),
      flags,
    )

    val dismissLabel = body.optString("dismissLabel").ifBlank { "Dismiss" }
    val viewSpotLabel = body.optString("viewSpotLabel").ifBlank { "View spot" }
    val icon = notificationIcon(context)

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(icon)
      .setContentTitle(title)
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(fullScreenPending)
      .setFullScreenIntent(fullScreenPending, true)
      .addAction(0, viewSpotLabel, fullScreenPending)
      .addAction(0, dismissLabel, dismissPending)

    try {
      NotificationManagerCompat.from(context).notify(requestCode, builder.build())
    } catch (error: SecurityException) {
      android.util.Log.w(TAG, "Could not post window-open notification", error)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = context.getSystemService(NotificationManager::class.java)
      if (manager?.getNotificationChannel(CHANNEL_ID) == null) {
        android.util.Log.w(TAG, "Alarm channel $CHANNEL_ID is missing")
      }
    }
  }

  private fun notificationIcon(context: Context): Int {
    val id = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    if (id != 0) {
      return id
    }
    return android.R.drawable.ic_lock_idle_alarm
  }

  companion object {
    private const val TAG = "SpotWindowOpen"
    private const val CHANNEL_ID = "geofence-spot-alarms"
  }
}
