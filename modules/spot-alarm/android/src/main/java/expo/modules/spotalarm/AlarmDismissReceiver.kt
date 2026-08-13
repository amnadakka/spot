package expo.modules.spotalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat

class AlarmDismissReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    SpotAlarmStore.markDismissed(context)
    NotificationManagerCompat.from(context).cancelAll()
  }
}
