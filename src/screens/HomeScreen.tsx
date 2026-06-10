import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import AddSpotForm from '../components/AddSpotForm';
import AppHeader from '../components/AppHeader';
import BottomNav, { type Tab } from '../components/BottomNav';
import ScreenLayout from '../components/ScreenLayout';
import EmptyState from '../components/EmptyState';
import HistoryScreen from '../components/HistoryScreen';
import HomeLiveMap from '../components/HomeLiveMap';
import LocationBanner from '../components/LocationBanner';
import MapPickerScreen, { type PickedLocation } from '../components/MapPickerScreen';
import SpotDetailScreen from '../components/SpotDetailScreen';
import SpotList from '../components/SpotList';
import { useReminderGeofencingSync } from '../hooks/useReminderGeofencingSync';
import { useUserLocation } from '../hooks/useUserLocation';
import { loadReminders, saveReminders } from '../storage/reminders';
import { colors } from '../theme/colors';
import type { Reminder } from '../types/reminder';
import {
  DEFAULT_REMINDER_RADIUS_METERS,
  MAX_ACTIVE_SPOTS,
  MAX_ACTIVE_SPOTS_MESSAGE,
} from '../types/reminder';

type Screen = 'home' | 'history' | 'map' | 'form' | 'detail';

const screenTitles: Record<Screen, string> = {
  home: 'Spots',
  history: 'History',
  map: 'New Spot',
  form: 'New Spot',
  detail: 'Spot Details',
};

function makeReminderId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export type HomeScreenHandle = {
  navigateToSpotDetail: (reminderId: string) => void;
};

const HomeScreen = forwardRef<HomeScreenHandle>(function HomeScreen(_props, ref) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<'home' | 'history'>('home');

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

  const navigateToSpotDetail = useCallback(
    (reminderId: string) => {
      const found = reminders.find((r) => r.id === reminderId);
      if (found) {
        setDetailOrigin(screen === 'history' ? 'history' : 'home');
        setSelectedReminder(found);
        setScreen('detail');
      }
    },
    [reminders, screen],
  );

  useImperativeHandle(
    ref,
    () => ({ navigateToSpotDetail }),
    [navigateToSpotDetail],
  );

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setScreen(tab);
    setSelectedReminder(null);
    if (tab === 'history') {
      setHistoryRefreshKey((key) => key + 1);
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setReminders((prev) => {
      const target = prev.find((reminder) => reminder.id === id);
      if (!target) {
        return prev;
      }

      if (!target.enabled) {
        const activeCount = prev.filter((reminder) => reminder.enabled).length;
        if (activeCount >= MAX_ACTIVE_SPOTS) {
          Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
          return prev;
        }
      }

      return prev.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder,
      );
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  }, []);

  const handleAdd = useCallback(() => {
    const activeCount = reminders.filter((reminder) => reminder.enabled).length;
    if (activeCount >= MAX_ACTIVE_SPOTS) {
      Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
      return;
    }
    setScreen('map');
  }, [reminders]);

  const handleLocationPicked = useCallback((location: PickedLocation) => {
    setPickedLocation(location);
    setScreen('form');
  }, []);

  const handleConfirm = useCallback(
    (title: string, description: string) => {
      if (!pickedLocation) {
        return;
      }

      const activeCount = reminders.filter((reminder) => reminder.enabled).length;
      if (activeCount >= MAX_ACTIVE_SPOTS) {
        Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
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
    [pickedLocation, reminders],
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

    if (screen === 'detail') {
      setSelectedReminder(null);
      setScreen(detailOrigin);
      setActiveTab(detailOrigin);
      return;
    }

    setScreen('home');
    setActiveTab('home');
  }, [screen]);

  const showNav = screen === 'home' || screen === 'history';
  const showBack = screen === 'map' || screen === 'form' || screen === 'detail';
  const activeCount = reminders.filter((reminder) => reminder.enabled).length;
  const atSpotLimit = activeCount >= MAX_ACTIVE_SPOTS;

  const headerSubtitle =
    screen === 'home'
      ? reminders.length > 0
        ? `${activeCount} of ${reminders.length} active`
        : `Up to ${MAX_ACTIVE_SPOTS} active spots`
      : undefined;

  if (loading) {
    return (
      <ScreenLayout style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout bottomInsetHandledExternally={showNav}>
      <AppHeader
        title={screenTitles[screen]}
        subtitle={headerSubtitle}
        count={screen === 'home' && reminders.length > 0 ? reminders.length : undefined}
        showBack={showBack}
        onBack={handleBack}
      />

      {screen === 'home' || screen === 'history' ? <LocationBanner status={locationStatus} /> : null}

      <View style={styles.content}>
        {screen === 'home' ? (
          <View style={styles.homeBody}>
            <View style={styles.listArea}>
              {reminders.length === 0 ? (
                <EmptyState onCreateFirst={handleAdd} />
              ) : (
                <SpotList
                  reminders={reminders}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                  onSpotPress={navigateToSpotDetail}
                  addDisabled={atSpotLimit}
                />
              )}
            </View>
            <HomeLiveMap reminders={reminders} />
          </View>
        ) : null}

        {screen === 'history' && (
          <HistoryScreen refreshKey={historyRefreshKey} onEventPress={navigateToSpotDetail} />
        )}

        {screen === 'map' && <MapPickerScreen onLocationPicked={handleLocationPicked} />}

        {screen === 'form' && pickedLocation ? (
          <AddSpotForm
            location={pickedLocation}
            onConfirm={handleConfirm}
            onDiscard={handleDiscard}
          />
        ) : null}

        {screen === 'detail' && selectedReminder ? (
          <SpotDetailScreen reminder={selectedReminder} />
        ) : null}
      </View>

      {showNav ? <BottomNav activeTab={activeTab} onTabChange={handleTabChange} /> : null}
    </ScreenLayout>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  homeBody: {
    flex: 1,
  },
  listArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
