import { setAudioModeAsync } from 'expo-audio';

let configured = false;

/** Alarm playback should ring through silent mode and continue in background. */
export async function configureAlarmAudioMode(): Promise<void> {
  if (configured) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'duckOthers',
  });

  configured = true;
}
