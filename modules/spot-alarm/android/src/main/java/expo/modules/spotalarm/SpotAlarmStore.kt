package expo.modules.spotalarm

import android.content.Context

object SpotAlarmStore {
  private const val PREFS = "spot_alarm_native"
  private const val DISMISSED_AT = "dismissed_at"
  private const val VIEW_REGION_ID = "view_region_id"
  private const val PENDING_REGION_IDS = "pending_region_ids"
  private const val PENDING_STARTED_AT = "pending_started_at"

  fun markDismissed(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(DISMISSED_AT, System.currentTimeMillis())
      .apply()
    clearPendingAlarm(context)
  }

  fun getDismissedAt(context: Context): Long {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getLong(DISMISSED_AT, 0L)
  }

  fun setViewRegionId(context: Context, regionId: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(VIEW_REGION_ID, regionId)
      .apply()
  }

  fun consumeViewRegionId(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val id = prefs.getString(VIEW_REGION_ID, null)
    if (id != null) {
      prefs.edit().remove(VIEW_REGION_ID).apply()
    }
    return id
  }

  fun setPendingAlarm(context: Context, regionIds: List<String>, startedAt: Long) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(PENDING_REGION_IDS, regionIds.joinToString("\u001f"))
      .putLong(PENDING_STARTED_AT, startedAt)
      .apply()
  }

  fun consumePendingAlarm(context: Context): Pair<List<String>, Long>? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(PENDING_REGION_IDS, null)
    val startedAt = prefs.getLong(PENDING_STARTED_AT, 0L)
    if (raw.isNullOrBlank() || startedAt <= 0L) {
      return null
    }

    prefs.edit()
      .remove(PENDING_REGION_IDS)
      .remove(PENDING_STARTED_AT)
      .apply()

    val regionIds = raw.split('\u001f').filter { it.isNotBlank() }
    if (regionIds.isEmpty()) {
      return null
    }

    return regionIds to startedAt
  }

  fun clearPendingAlarm(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .remove(PENDING_REGION_IDS)
      .remove(PENDING_STARTED_AT)
      .apply()
  }

  fun launchMainApp(context: Context) {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(
      android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
        android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or
        android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
    )
    context.startActivity(launch)
  }
}
