package expo.modules.spotalarm

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

class AlarmActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    turnScreenOn()

    val body = parseBody(intent.getStringExtra(EXTRA_BODY))
    val title = intent.getStringExtra(EXTRA_TITLE)?.takeIf { it.isNotBlank() }
      ?: body.optString("title").takeIf { it.isNotBlank() }
      ?: "Spot Alarm"
    val subtitle = intent.getStringExtra(EXTRA_TEXT)?.takeIf { it.isNotBlank() }
      ?: body.optString("text").takeIf { it.isNotBlank() }
      ?: ""
    val eyebrow = body.optString("eyebrow").takeIf { it.isNotBlank() } ?: "Spot alarm"
    val dismissLabel = body.optString("dismissLabel").takeIf { it.isNotBlank() } ?: "Dismiss"
    val viewSpotLabel = body.optString("viewSpotLabel").takeIf { it.isNotBlank() } ?: "View spot"
    val regionIds = regionIdsFromBody(body)

    setContentView(buildLayout(eyebrow, title, subtitle, viewSpotLabel, dismissLabel, regionIds))
  }

  private fun turnScreenOn() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    @Suppress("DEPRECATION")
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
    )
  }

  private fun buildLayout(
    eyebrow: String,
    title: String,
    subtitle: String,
    viewSpotLabel: String,
    dismissLabel: String,
    regionIds: List<String>,
  ): ScrollView {
    val density = resources.displayMetrics.density
    fun dp(value: Int) = (value * density).toInt()

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.WHITE)
      setPadding(dp(32), dp(72), dp(32), dp(32))
      gravity = Gravity.CENTER_HORIZONTAL
    }

    val badge = TextView(this).apply {
      text = "\u23F0"
      gravity = Gravity.CENTER
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 40f)
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.parseColor("#DBEAFE"))
      }
      layoutParams = LinearLayout.LayoutParams(dp(96), dp(96)).apply {
        bottomMargin = dp(20)
        gravity = Gravity.CENTER_HORIZONTAL
      }
    }

    val eyebrowView = TextView(this).apply {
      text = eyebrow.uppercase()
      setTextColor(Color.parseColor("#3B82F6"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      setTypeface(typeface, Typeface.BOLD)
      letterSpacing = 0.08f
      gravity = Gravity.CENTER
    }

    val titleView = TextView(this).apply {
      text = title
      setTextColor(Color.parseColor("#0F172A"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
      setTypeface(typeface, Typeface.BOLD)
      gravity = Gravity.CENTER
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply { topMargin = dp(8) }
    }

    val subtitleView = TextView(this).apply {
      text = subtitle
      setTextColor(Color.parseColor("#64748B"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      gravity = Gravity.CENTER
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply { topMargin = dp(8); bottomMargin = dp(36) }
    }

    val spacer = LinearLayout(this).apply {
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        0,
        1f,
      )
    }

    val viewButton = outlineButton(viewSpotLabel, dp(16)) {
      openApp(regionIds)
    }
    val dismissButton = filledButton(dismissLabel, dp(16)) {
      dismissAlarm()
    }

    root.addView(badge)
    root.addView(eyebrowView)
    root.addView(titleView)
    root.addView(subtitleView)
    root.addView(spacer)
    root.addView(viewButton)
    root.addView(dismissButton)

    return ScrollView(this).apply {
      isFillViewport = true
      addView(
        root,
        LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.MATCH_PARENT,
        ),
      )
    }
  }

  private fun outlineButton(label: String, radius: Int, onClick: () -> Unit): Button {
    return Button(this).apply {
      text = label
      isAllCaps = false
      setTextColor(Color.parseColor("#0F172A"))
      background = GradientDrawable().apply {
        cornerRadius = radius.toFloat()
        setStroke((2 * resources.displayMetrics.density).toInt(), Color.parseColor("#CBD5E1"))
        setColor(Color.WHITE)
      }
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      ).apply { bottomMargin = (12 * resources.displayMetrics.density).toInt() }
      setOnClickListener { onClick() }
    }
  }

  private fun filledButton(label: String, radius: Int, onClick: () -> Unit): Button {
    return Button(this).apply {
      text = label
      isAllCaps = false
      setTextColor(Color.WHITE)
      background = GradientDrawable().apply {
        cornerRadius = radius.toFloat()
        setColor(Color.parseColor("#3B82F6"))
      }
      layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
      )
      setOnClickListener { onClick() }
    }
  }

  private fun dismissAlarm() {
    SpotAlarmStore.markDismissed(this)
    NotificationManagerCompat.from(this).cancelAll()
    finish()
  }

  private fun openApp(regionIds: List<String>) {
    if (regionIds.size == 1) {
      SpotAlarmStore.setViewRegionId(this, regionIds[0])
      SpotAlarmStore.markDismissed(this)
    }
    NotificationManagerCompat.from(this).cancelAll()
    SpotAlarmStore.launchMainApp(this)
    finish()
  }

  companion object {
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"
    const val EXTRA_BODY = "body"

    fun parseBody(raw: String?): JSONObject {
      return try {
        JSONObject(raw ?: "{}")
      } catch (_: Exception) {
        JSONObject()
      }
    }

    fun regionIdsFromBody(body: JSONObject): List<String> {
      val ids = mutableListOf<String>()
      val array = body.optJSONArray("regionIds")
      if (array != null) {
        for (index in 0 until array.length()) {
          val id = array.optString(index)
          if (id.isNotBlank()) {
            ids.add(id)
          }
        }
      }
      if (ids.isEmpty()) {
        val single = body.optString("regionId")
        if (single.isNotBlank()) {
          ids.add(single)
        }
      }
      return ids
    }
  }
}
