import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, DeviceEventEmitter, Platform, StyleSheet, View } from 'react-native';

import AddSpotForm from '../components/AddSpotForm';
import AppHeader from '../components/AppHeader';
import BottomNav, { type Tab } from '../components/BottomNav';
import CalendarScreen from '../components/CalendarScreen';
import ScreenLayout from '../components/ScreenLayout';
import HistoryScreen from '../components/HistoryScreen';
import HomeLiveMap from '../components/HomeLiveMap';
import HomeSpotsSheet from '../components/HomeSpotsSheet';
import LocationBanner from '../components/LocationBanner';
import MapPickerScreen, { type PickedLocation } from '../components/MapPickerScreen';
import SettingsScreen from '../components/settings/SettingsScreen';
import SpotDetailScreen from '../components/SpotDetailScreen';
import TextScreen from '../components/TextScreen';
import { useI18n } from '../i18n/I18nContext';
import { useLiveUserLocation } from '../hooks/useLiveUserLocation';
import { useOccupiedSpotIds } from '../hooks/useOccupiedSpotIds';
import { useReminderGeofencingSync } from '../hooks/useReminderGeofencingSync';
import { useScheduledOccupiedSpotAlarms } from '../hooks/useScheduledOccupiedSpotAlarms';
import { useUserLocation } from '../hooks/useUserLocation';
import { cancelLegacyScheduledNotifications } from '../services/cancelLegacyScheduledNotifications';
import { REMINDERS_CHANGED_EVENT } from '../storage/consumeDateUnlinkedReminders';
import { loadReminders, saveReminders } from '../storage/reminders';
import { deleteHistoryEvent, deleteHistoryEvents, reminderFromHistoryEvent } from '../storage/history';
import { useTheme } from '../theme/ThemeContext';
import type { Reminder, ReminderRadiusMeters, ReminderSchedule } from '../types/reminder';
import type { HistoryEvent } from '../types/history';
import { MAX_ACTIVE_SPOTS } from '../types/reminder';
import {
  activeSpotOverlapWarningMessage,
  findOverlappingActiveReminder,
} from '../utils/activeReminderProximity';

type Screen = 'home' | 'calendar' | 'history' | 'text' | 'settings' | 'map' | 'form' | 'detail';

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
  const { t } = useI18n();
  const screenTitles: Record<Screen, string> = {
    home: t.spotsTitle,
    calendar: t.calendarTitle,
    history: t.historyTitle,
    text: t.textTitle,
    settings: t.settingsTitle,
    map: t.newSpotTitle,
    form: t.newSpotTitle,
    detail: t.spotDetailsTitle,
  };
  const { colors } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const pendingNavigationRef = useRef<PendingSpotNavigation | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [detailTriggeredAt, setDetailTriggeredAt] = useState<string | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<'home' | 'calendar' | 'history'>('home');
  const [homeBodyHeight, setHomeBodyHeight] = useState(0);

  const locationStatus = useUserLocation(true);
  const liveUserLocation = useLiveUserLocation();
  const occupiedSpotIds = useOccupiedSpotIds(reminders, liveUserLocation);
  useReminderGeofencingSync(reminders);
  useScheduledOccupiedSpotAlarms(reminders, liveUserLocation);

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
    function reloadRemindersFromDisk() {
      void loadReminders().then(setReminders);
    }

    const remindersSub = DeviceEventEmitter.addListener(
      REMINDERS_CHANGED_EVENT,
      reloadRemindersFromDisk,
    );
    const appSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reloadRemindersFromDisk();
      }
    });

    return () => {
      remindersSub.remove();
      appSub.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    void saveReminders(reminders);
  }, [loading, reminders]);

  const openSpotDetail = useCallback(
    (
      reminder: Reminder,
      options?: { triggeredAt?: string | null; origin?: 'home' | 'calendar' | 'history' },
    ) => {
      const origin =
        options?.origin ??
        (activeTab === 'history' ? 'history' : activeTab === 'calendar' ? 'calendar' : 'home');
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
        Alert.alert(t.spotUnavailableTitle, t.spotUnavailableBody);
        return;
      }

      setDetailOrigin('history');
      setDetailTriggeredAt(event.triggeredAt);
      setSelectedReminder(reminder);
      setScreen('detail');
    },
    [reminders, t],
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
          Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
          return prev;
        }
      }

      return prev.map((reminder) =>
        reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder,
      );
    });
  }, [t]);

  const handleSetEnabledMany = useCallback(
    (ids: string[], enabled: boolean) => {
      setReminders((prev) => {
        const idSet = new Set(ids);

        if (enabled) {
          const activeCount = prev.filter((reminder) => reminder.enabled).length;
          const toEnable = prev.filter(
            (reminder) => idSet.has(reminder.id) && !reminder.enabled,
          ).length;
          if (activeCount + toEnable > MAX_ACTIVE_SPOTS) {
            Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
            return prev;
          }
        }

        return prev.map((reminder) =>
          idSet.has(reminder.id) ? { ...reminder, enabled } : reminder,
        );
      });
    },
    [t],
  );

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
      Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
      return;
    }
    setScreen('map');
  }, [reminders, t]);

  const handleLocationPicked = useCallback((location: PickedLocation) => {
    setPickedLocation(location);
    setScreen('form');
  }, []);

  const saveNewReminder = useCallback(
    (
      title: string,
      description: string,
      radiusMeters: ReminderRadiusMeters,
      schedule: ReminderSchedule | undefined,
      enabled: boolean,
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
        enabled,
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
      schedule: ReminderSchedule | undefined,
      enabled: boolean,
    ) => {
      if (!pickedLocation) {
        return;
      }

      if (enabled) {
        const activeCount = reminders.filter((reminder) => reminder.enabled).length;
        if (activeCount >= MAX_ACTIVE_SPOTS) {
          Alert.alert(t.spotLimitTitle, t.spotLimitMessage);
          return;
        }

        const conflict = findOverlappingActiveReminder(reminders, pickedLocation, { radiusMeters });
        if (conflict) {
          Alert.alert(
            t.overlappingRangeTitle,
            activeSpotOverlapWarningMessage(conflict, t.overlappingRangeBody),
            [
              { text: t.goBackAction, style: 'cancel' },
              {
                text: t.saveAnyway,
                onPress: () => saveNewReminder(title, description, radiusMeters, schedule, enabled),
              },
            ],
          );
          return;
        }
      }

      saveNewReminder(title, description, radiusMeters, schedule, enabled);
    },
    [pickedLocation, reminders, saveNewReminder, t],
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

  const showNav =
    screen === 'home' ||
    screen === 'calendar' ||
    screen === 'history' ||
    screen === 'text' ||
    screen === 'settings';
  const showBack = screen === 'map' || screen === 'form' || screen === 'detail';

  // Android system back (button or edge swipe) mirrors the header back button.
  useEffect(() => {
    if (Platform.OS !== 'android' || !showBack) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  }, [showBack, handleBack]);
  const activeCount = reminders.filter((reminder) => reminder.enabled).length;
  const atSpotLimit = activeCount >= MAX_ACTIVE_SPOTS;

  // Fixed to the default sheet snap (48%) so the map does not reframe when the sheet moves.
  const mapPadding = useMemo(() => {
    const bottomPad = homeBodyHeight > 0 ? Math.round(homeBodyHeight * 0.48) : 200;
    return { top: 12, right: 12, bottom: bottomPad, left: 12 };
  }, [homeBodyHeight]);

  const headerTitle = screen === 'settings' ? t.settingsTitle : screenTitles[screen];
  const isHome = screen === 'home';

  if (loading) {
    return (
      <ScreenLayout style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout bottomInsetHandledExternally={showNav}>
      {!isHome ? (
        <AppHeader title={headerTitle} showBack={showBack} onBack={handleBack} />
      ) : null}

      {screen === 'history' ? <LocationBanner status={locationStatus} /> : null}

      <View style={styles.content}>
        {isHome ? (
          <View
            style={styles.homeBody}
            onLayout={(e) => setHomeBodyHeight(e.nativeEvent.layout.height)}
          >
            <HomeLiveMap
              style={StyleSheet.absoluteFillObject}
              reminders={reminders}
              occupiedSpotIds={occupiedSpotIds}
              userLocation={
                liveUserLocation ??
                (locationStatus.kind === 'ok'
                  ? { latitude: locationStatus.latitude, longitude: locationStatus.longitude }
                  : null)
              }
              mapPadding={mapPadding}
              onSpotPress={navigateToSpotDetail}
            />
            <View style={styles.homeBanner} pointerEvents="box-none">
              <LocationBanner status={locationStatus} />
            </View>
            <HomeSpotsSheet
              reminders={reminders}
              occupiedSpotIds={occupiedSpotIds}
              atSpotLimit={atSpotLimit}
              onToggle={handleToggle}
              onSetEnabledMany={handleSetEnabledMany}
              onDeleteMany={handleDeleteMany}
              onAdd={handleAdd}
              onSpotPress={navigateToSpotDetail}
            />
          </View>
        ) : null}

        {screen === 'calendar' ? (
          <CalendarScreen reminders={reminders} onSpotPress={navigateToSpotDetail} />
        ) : null}

        {screen === 'history' && (
          <HistoryScreen
            refreshKey={historyRefreshKey}
            onEventPress={navigateFromHistoryEvent}
            onDeleteEvent={handleDeleteHistoryEvent}
            onDeleteEvents={handleDeleteHistoryEvents}
          />
        )}

        {screen === 'text' ? <TextScreen reminders={reminders} /> : null}

        {screen === 'settings' ? <SettingsScreen /> : null}

        {screen === 'map' && <MapPickerScreen onLocationPicked={handleLocationPicked} />}

        {screen === 'form' && pickedLocation ? (
          <AddSpotForm
            location={pickedLocation}
            onConfirm={handleConfirm}
            onDiscard={handleDiscard}
            onEditLocation={() => setScreen('map')}
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
  homeBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
});
