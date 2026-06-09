import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

import AddSpotForm from '../components/AddSpotForm';
import AppHeader from '../components/AppHeader';
import BottomNav, { type Tab } from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import HistoryScreen from '../components/HistoryScreen';
import LocationBanner from '../components/LocationBanner';
import MapPickerScreen, { type PickedLocation } from '../components/MapPickerScreen';
import SpotList from '../components/SpotList';
import { useReminderGeofencingSync } from '../hooks/useReminderGeofencingSync';
import { useUserLocation } from '../hooks/useUserLocation';
import { loadReminders, saveReminders } from '../storage/reminders';
import { colors } from '../theme/colors';
import type { Reminder } from '../types/reminder';
import { DEFAULT_REMINDER_RADIUS_METERS } from '../types/reminder';

type Screen = 'home' | 'history' | 'map' | 'form';

const screenTitles: Record<Screen, string> = {
  home: 'Spots',
  history: 'History',
  map: 'New Spot',
  form: 'New Spot',
};

function makeReminderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const locationStatus = useUserLocation();
  useReminderGeofencingSync(reminders);

  useEffect(() => {
    let cancelled = false;

    void loadReminders().then((loaded) => {
      if (!cancelled) {
        setReminders(loaded);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    void saveReminders(reminders);
  }, [loading, reminders]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setScreen(tab);
    if (tab === 'history') {
      setHistoryRefreshKey((key) => key + 1);
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder,
      ),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  }, []);

  const handleAdd = useCallback(() => {
    setScreen('map');
  }, []);

  const handleLocationPicked = useCallback((location: PickedLocation) => {
    setPickedLocation(location);
    setScreen('form');
  }, []);

  const handleConfirm = useCallback(
    (title: string, description: string) => {
      if (!pickedLocation) {
        return;
      }

      const newReminder: Reminder = {
        id: makeReminderId(),
        title,
        description: description || undefined,
        address: pickedLocation.address,
        latitude: pickedLocation.latitude,
        longitude: pickedLocation.longitude,
        radiusMeters: DEFAULT_REMINDER_RADIUS_METERS,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      setReminders((prev) => [newReminder, ...prev]);
      setPickedLocation(null);
      setScreen('home');
      setActiveTab('home');
    },
    [pickedLocation],
  );

  const handleDiscard = useCallback(() => {
    setPickedLocation(null);
    setScreen('home');
    setActiveTab('home');
  }, []);

  const handleBack = useCallback(() => {
    if (screen === 'form') {
      setScreen('map');
      return;
    }

    setScreen('home');
    setActiveTab('home');
  }, [screen]);

  const showNav = screen === 'home' || screen === 'history';
  const showBack = screen === 'map' || screen === 'form';
  const activeCount = reminders.filter((reminder) => reminder.enabled).length;

  const headerSubtitle =
    screen === 'home' && reminders.length > 0
      ? `${activeCount} of ${reminders.length} active`
      : undefined;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <AppHeader
        title={screenTitles[screen]}
        subtitle={headerSubtitle}
        count={screen === 'home' && reminders.length > 0 ? reminders.length : undefined}
        showBack={showBack}
        onBack={handleBack}
      />

      {screen === 'home' || screen === 'history' ? <LocationBanner status={locationStatus} /> : null}

      <View style={styles.content}>
        {screen === 'home' &&
          (reminders.length === 0 ? (
            <EmptyState onCreateFirst={handleAdd} />
          ) : (
            <SpotList
              reminders={reminders}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))}

        {screen === 'history' && <HistoryScreen refreshKey={historyRefreshKey} />}

        {screen === 'map' && <MapPickerScreen onLocationPicked={handleLocationPicked} />}

        {screen === 'form' && pickedLocation ? (
          <AddSpotForm
            location={pickedLocation}
            onConfirm={handleConfirm}
            onDiscard={handleDiscard}
          />
        ) : null}
      </View>

      {showNav ? <BottomNav activeTab={activeTab} onTabChange={handleTabChange} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
});
