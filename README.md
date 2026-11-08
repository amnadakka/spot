# Spot

Location-based reminders that fire when you arrive.

Spot lets you pin places on a map and get notified (with a full alarm-style ring) when you get nearby. Save a spot, optionally add a date or time window, and Spot handles the rest via geofencing.

> **Vibe coded** — built experimentally with AI assistance, not a polished production product.

## How it works

1. **Add a spot** — Pick a place on the map, name it, and save your location reminder.
2. **Set date or time** (optional) — Limit when the reminder can fire with a schedule window.
3. **You're ready** — Spot notifies you when you arrive nearby.

## Features

- Map-based spot picker with live location
- Geofence alarms when you enter a saved place
- Optional schedules (one-shot, daily, weekly, time windows)
- Calendar and history views
- Themes, ringtones, and light/dark styling
- English, German, and Arabic (RTL)
- Android full-screen alarm support via a custom native module

## Stack

- [Expo](https://expo.dev) / React Native
- `expo-location` + `expo-task-manager` for background geofencing
- `expo-notifications` + `expo-audio` for alarms
- Custom `spot-alarm` Android module for exact / full-screen alarms
- AsyncStorage for local data

## Getting started

```bash
npm install
npx expo start
```

For a native Android build (needed for the custom alarm module and background location):

```bash
npm run android
# or
npm run build:android:dev
```

You'll need a Google Maps API key configured for maps and places (see `app.json` / Expo config).

## Notes

- Up to 5 spots can be active at once (battery / OS geofence limits).
- Background location, notifications, and (on Android) battery / full-screen intent permissions matter for reliable alarms.
- Data stays on-device; there's no backend account system yet.

## License

Private — not published for general use.
