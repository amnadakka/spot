package expo.modules.spotalarm

import android.content.Context

object SpotAlarmStore {
  private const val PREFS = "spot_alarm_native"
  private const val DISMISSED_AT = "dismissed_at"
  private const val VIEW_REGION_ID = "view_region_id"

  fun markDismissed(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putLong(DISMISSED_AT, System.currentTimeMillis())
      .apply()
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
