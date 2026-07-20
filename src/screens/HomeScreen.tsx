import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
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
import { useLiveUserLocation } from '../hooks/useLiveUserLocation';
import { useOccupiedSpotIds } from '../hooks/useOccupiedSpotIds';
import { useReminderGeofencingSync } from '../hooks/useReminderGeofencingSync';
import { useUserLocation } from '../hooks/useUserLocation';
import { cancelLegacyScheduledNotifications } from '../services/cancelLegacyScheduledNotifications';
import { loadReminders, saveReminders } from '../storage/reminders';
import { deleteHistoryEvent, deleteHistoryEvents, reminderFromHistoryEvent } from '../storage/history';
import { colors } from '../theme/colors';
import type { Reminder, ReminderRadiusMeters, ReminderSchedule } from '../types/reminder';
import type { HistoryEvent } from '../types/history';
import {
  MAX_ACTIVE_SPOTS,
  MAX_ACTIVE_SPOTS_MESSAGE,
} from '../types/reminder';
import {
  activeSpotOverlapWarningMessage,
  findOverlappingActiveReminder,
} from '../utils/activeReminderProximity';

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
  navigateToSpotDetail: (reminderId: string, options?: { triggeredAt?: string | null }) => void;
};

type PendingSpotNavigation = {
  reminderId: string;
  triggeredAt?: string | null;
};

const HomeScreen = forwardRef<HomeScreenHandle>(function HomeScreen(_props, ref) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingNavigationRef = useRef<PendingSpotNavigation | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailTriggeredAt, setDetailTriggeredAt] = useState<string | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<'home' | 'history'>('home');

  const locationStatus = useUserLocation();
  const liveUserLocation = useLiveUserLocation();
  const occupiedSpotIds = useOccupiedSpotIds(reminders, liveUserLocation);
  useReminderGeofencingSync(reminders);

  useEffect(() => {
    let cancelled = false;

    void loadReminders()
      .then((loaded) => cancelLegacyScheduledNotifications(loaded))
      .then((loaded) => {
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

  const openSpotDetail = useCallback(
    (reminder: Reminder, options?: { triggeredAt?: string | null; origin?: 'home' | 'history' }) => {
      const origin = options?.origin ?? (activeTab === 'history' ? 'history' : 'home');
      setDetailOrigin(origin);
      setDetailTriggeredAt(options?.triggeredAt ?? null);
      setSelectedReminder(reminder);
      setScreen('detail');
      setActiveTab(origin);
    },
    [activeTab],
  );

  const navigateToSpotDetail = useCallback(
    (reminderId: string, options?: { triggeredAt?: string | null }) => {
      const found = reminders.find((r) => r.id === reminderId);
      if (found) {
        openSpotDetail(found, options);
        pendingNavigationRef.current = null;
        return;
      }

      pendingNavigationRef.current = {
        reminderId,
        triggeredAt: options?.triggeredAt ?? null,
      };
    },
    [reminders, openSpotDetail],
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const pending = pendingNavigationRef.current;
    if (!pending) {
      return;
    }

    const found = reminders.find((reminder) => reminder.id === pending.reminderId);
    if (!found) {
      pendingNavigationRef.current = null;
      return;
    }

    openSpotDetail(found, { triggeredAt: pending.triggeredAt, origin: 'home' });
    pendingNavigationRef.current = null;
  }, [loading, reminders, openSpotDetail]);

  const navigateFromHistoryEvent = useCallback(
    (event: HistoryEvent) => {
      const live = reminders.find((reminder) => reminder.id === event.reminderId);
      const reminder = reminderFromHistoryEvent(event, live);

      if (!reminder) {
        Alert.alert(
          'Spot unavailable',
          'This history entry does not have enough location data to show details.',
        );
        return;
      }

      setDetailOrigin('history');
      setDetailTriggeredAt(event.triggeredAt);
      setSelectedReminder(reminder);
      setScreen('detail');
    },
    [reminders],
  );

  const handleDeleteHistoryEvent = useCallback((eventId: string) => {
    void deleteHistoryEvent(eventId)
      .then(() => {
        setHistoryRefreshKey((key) => key + 1);
      })
      .catch((error) => {
        console.warn('[History] Delete failed:', error);
        setHistoryRefreshKey((key) => key + 1);
      });
  }, []);

  const handleDeleteHistoryEvents = useCallback((eventIds: string[]) => {
    void deleteHistoryEvents(eventIds)
      .then(() => {
        setHistoryRefreshKey((key) => key + 1);
      })
      .catch((error) => {
        console.warn('[History] Bulk delete failed:', error);
        setHistoryRefreshKey((key) => key + 1);
      });
  }, []);

  useImperativeHandle(
    ref,
    () => ({ navigateToSpotDetail }),
    [navigateToSpotDetail],
  );

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setScreen(tab);
    setSelectedReminder(null);
    setDetailTriggeredAt(null);
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

  const handleDeleteMany = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setReminders((prev) => prev.filter((reminder) => !idSet.has(reminder.id)));
  }, []);

  const handleUpdateReminder = useCallback(
    (reminderId: string, updates: { description?: string; schedule?: ReminderSchedule }) => {
      setReminders((prev) =>
        prev.map((reminder) => {
          if (reminder.id !== reminderId) {
            return reminder;
          }

          return {
            ...reminder,
            description: updates.description,
            schedule: updates.schedule,
          };
        }),
      );

      setSelectedReminder((current) => {
        if (!current || current.id !== reminderId) {
          return current;
        }

        return {
          ...current,
          description: updates.description,
          schedule: updates.schedule,
        };
      });
    },
    [],
  );

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

  const saveNewReminder = useCallback(
    (
      title: string,
      description: string,
      radiusMeters: ReminderRadiusMeters,
      schedule?: ReminderSchedule,
    ) => {
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
        radiusMeters,
        enabled: true,
        createdAt: new Date().toISOString(),
        schedule,
      };

      setReminders((prev) => [newReminder, ...prev]);
      setPickedLocation(null);
      setScreen('home');
      setActiveTab('home');
    },
    [pickedLocation],
  );

  const handleConfirm = useCallback(
    (
      title: string,
      description: string,
      radiusMeters: ReminderRadiusMeters,
      schedule?: ReminderSchedule,
    ) => {
      if (!pickedLocation) {
        return;
      }

      const activeCount = reminders.filter((reminder) => reminder.enabled).length;
      if (activeCount >= MAX_ACTIVE_SPOTS) {
        Alert.alert('Spot limit reached', MAX_ACTIVE_SPOTS_MESSAGE);
        return;
      }

      const conflict = findOverlappingActiveReminder(reminders, pickedLocation, { radiusMeters });
      if (conflict) {
        Alert.alert('Overlapping range', activeSpotOverlapWarningMessage(conflict), [
          { text: 'Go back', style: 'cancel' },
          {
            text: 'Save anyway',
            onPress: () => saveNewReminder(title, description, radiusMeters, schedule),
          },
        ]);
        return;
      }

      saveNewReminder(title, description, radiusMeters, schedule);
    },
    [pickedLocation, reminders, saveNewReminder],
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
      setDetailTriggeredAt(null);
      setScreen(detailOrigin);
      setActiveTab(detailOrigin);
      return;
    }

    setScreen('home');
    setActiveTab('home');
  }, [screen, detailOrigin]);

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
            <HomeLiveMap
              reminders={reminders}
              occupiedSpotIds={occupiedSpotIds}
              userLocation={
                liveUserLocation ??
                (locationStatus.kind === 'ok'
                  ? { latitude: locationStatus.latitude, longitude: locationStatus.longitude }
                  : null)
              }
            />
            <View style={styles.listArea}>
              {reminders.length === 0 ? (
                <EmptyState onCreateFirst={handleAdd} />
              ) : (
                <SpotList
                  reminders={reminders}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onDeleteMany={handleDeleteMany}
                  onAdd={handleAdd}
                  onSpotPress={navigateToSpotDetail}
                  addDisabled={atSpotLimit}
                  occupiedSpotIds={occupiedSpotIds}
                />
              )}
            </View>
          </View>
        ) : null}

        {screen === 'history' && (
          <HistoryScreen
            refreshKey={historyRefreshKey}
            onEventPress={navigateFromHistoryEvent}
            onDeleteEvent={handleDeleteHistoryEvent}
            onDeleteEvents={handleDeleteHistoryEvents}
          />
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
          <SpotDetailScreen
            reminder={
              reminders.find((reminder) => reminder.id === selectedReminder.id) ?? selectedReminder
            }
            triggeredAt={detailTriggeredAt ?? undefined}
            allowEdit={reminders.some((reminder) => reminder.id === selectedReminder.id)}
            onUpdate={handleUpdateReminder}
          />
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
