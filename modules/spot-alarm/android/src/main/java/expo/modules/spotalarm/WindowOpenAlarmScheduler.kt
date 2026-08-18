package expo.modules.spotalarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject

object WindowOpenAlarmScheduler {
  const val ACTION = "expo.modules.spotalarm.WINDOW_OPEN"
  const val EXTRA_REGION_ID = "regionId"

  private const val PREFS = "spot_window_open_alarms"
  private const val OVERDUE_GRACE_MS = 30 * 60 * 1000L

  fun schedule(
    context: Context,
    regionId: String,
    triggerAt: Long,
    title: String,
    text: String,
    body: String,
  ): Boolean {
    val app = context.applicationContext
    val payload = JSONObject()
      .put("triggerAt", triggerAt)
      .put("title", title)
      .put("text", text)
      .put("body", body)
      .toString()

    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(regionId, payload)
      .apply()

    enqueue(app, regionId, triggerAt)
    return true
  }

  fun cancel(context: Context, regionId: String) {
    val app = context.applicationContext
    app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(regionId)
      .apply()
    cancelPending(app, regionId)
  }

  fun cancelExcept(context: Context, keepIds: Set<String>) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val stale = prefs.all.keys.filter { it !in keepIds }
    if (stale.isEmpty()) {
      return
    }

    val editor = prefs.edit()
    for (regionId in stale) {
      editor.remove(regionId)
      cancelPending(app, regionId)
    }
    editor.apply()
  }

  fun restore(context: Context) {
    val app = context.applicationContext
    val prefs = app.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val now = System.currentTimeMillis()
    val editor = prefs.edit()

    for ((regionId, raw) in prefs.all) {
      val payload = raw as? String ?: continue
      val triggerAt = try {
        JSONObject(payload).optLong("triggerAt", 0L)
      } catch (_: Exception) {
        0L
      }

      if (triggerAt <= 0L) {
        editor.remove(regionId)
        continue
      }

      if (triggerAt <= now) {
        if (now - triggerAt <= OVERDUE_GRACE_MS) {
          app.sendBroadcast(receiverIntent(app, regionId))
        } else {
          editor.remove(regionId)
        }
        continue
      }

      enqueue(app, regionId, triggerAt)
    }

    editor.apply()
  }

  fun readPayload(context: Context, regionId: String): JSONObject? {
    val raw = context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(regionId, null)
      ?: return null

    return try {
      JSONObject(raw)
    } catch (_: Exception) {
      null
    }
  }

  fun removePayload(context: Context, regionId: String) {
    context.applicationContext
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(regionId)
      .apply()
  }

  private fun enqueue(context: Context, regionId: String, triggerAt: Long) {
    val manager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pending = pendingIntent(context, regionId, PendingIntent.FLAG_UPDATE_CURRENT) ?: return

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
        return
      }

      @Suppress("DEPRECATION")
      manager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pending)
    } catch (_: SecurityException) {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
    }
  }

  private fun cancelPending(context: Context, regionId: String) {
    val manager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val pending = pendingIntent(context, regionId, PendingIntent.FLAG_NO_CREATE) ?: return
    manager.cancel(pending)
    pending.cancel()
  }

  private fun pendingIntent(context: Context, regionId: String, extraFlags: Int): PendingIntent? {
    val flags = extraFlags or PendingIntent.FLAG_IMMUTABLE
    return PendingIntent.getBroadcast(
      context,
      requestCode(regionId),
      receiverIntent(context, regionId),
      flags,
    )
  }

  private fun receiverIntent(context: Context, regionId: String): Intent {
    return Intent(context, WindowOpenAlarmReceiver::class.java).apply {
      action = ACTION
      putExtra(EXTRA_REGION_ID, regionId)
      data = android.net.Uri.parse("spot://window-open/$regionId")
    }
  }

  private fun requestCode(regionId: String): Int {
    return regionId.hashCode()
  }
}
