export type AppLanguage = 'en' | 'de' | 'ar';

export type AppTranslations = {
  // Common
  cancel: string;
  delete: string;
  moreOptions: string;
  edit: string;
  save: string;
  discard: string;
  confirm: string;
  optional: string;
  optionalLabel: string;
  anytime: string;
  on: string;
  off: string;
  notSet: string;
  goBack: string;
  dismiss: string;
  close: string;
  continue: string;
  done: string;
  enable: string;
  openSettings: string;
  openSettingsShort: string;
  gotIt: string;
  selectAll: string;
  selectAllShort: string;
  deselectAll: string;
  selectedCount: string;
  notNow: string;

  // Nav & screens
  tabHome: string;
  tabCalendar: string;
  tabHistory: string;
  tabText: string;
  spotsTitle: string;
  calendarTitle: string;
  historyTitle: string;
  textTitle: string;
  settingsTitle: string;
  newSpotTitle: string;
  spotDetailsTitle: string;
  activeOfTotal: string;
  upToActiveSpots: string;

  // Calendar
  calendarNoReminders: string;
  calendarReminderCount: string;
  calendarEmptyHint: string;
  calendarPreviousMonthA11y: string;
  calendarNextMonthA11y: string;

  // Text tab
  textRemindNearby: string;
  textRemindNearbyWithDescription: string;
  textEmptyTitle: string;
  textEmptySubtitle: string;

  // Settings
  sectionProfile: string;
  sectionApplication: string;
  sectionSupport: string;
  sectionDataPrivacy: string;
  notifications: string;
  locationAccess: string;
  language: string;
  theme: string;
  signUp: string;
  signUpTitle: string;
  signUpBody: string;
  howItWorks: string;
  contactUs: string;
  contactUsPhone: string;
  privacy: string;
  batteryUsage: string;
  statusEnabled: string;
  statusDisabled: string;
  statusWhileInUse: string;
  statusAlways: string;
  statusDenied: string;
  statusOff: string;
  languageEnglish: string;
  languageGerman: string;
  languageArabic: string;
  chooseLanguage: string;
  themeDefault: string;
  themeDucky: string;
  themeNight: string;
  chooseTheme: string;
  howItWorksTitle: string;
  howItWorksStep1Title: string;
  howItWorksStep1Body: string;
  howItWorksStep2Title: string;
  howItWorksStep2Body: string;
  howItWorksStep3Title: string;
  howItWorksStep3Body: string;
  privacyTitle: string;
  privacyBody: string;
  batteryTitle: string;
  batteryBody: string;
  notificationsSheetTitle: string;
  notificationsSheetBody: string;
  locationSheetTitle: string;
  locationSheetBody: string;

  // Onboarding
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingContinue: string;

  // Empty / home
  emptyTitle: string;
  emptySubtitle: string;
  emptyCta: string;

  // Spot list
  deleteSpotsTitle: string;
  deleteSpotConfirmOne: string;
  deleteSpotsConfirmMany: string;
  selectSpotsToDelete: string;
  deleteSpotA11y: string;
  addNewSpotA11y: string;
  turnOnSpots: string;
  turnOffSpots: string;
  spotLimitTitle: string;
  spotLimitMessage: string;

  // History
  historyEmptyTitle: string;
  historyEmptySubtitle: string;
  deleteHistoryTitle: string;
  deleteHistoryConfirmOne: string;
  deleteHistoryConfirmMany: string;
  selectEntriesToDelete: string;
  deleteHistoryEntryA11y: string;
  spotUnavailableTitle: string;
  spotUnavailableBody: string;

  // Add / form
  selectedLocation: string;
  fieldTitle: string;
  fieldDescription: string;
  descriptionLabel: string;
  reminderTimeLabel: string;
  reminderDateLabel: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  descriptionPlaceholderShort: string;
  reminderRange: string;
  reminderDistance: string;
  rangeHint: string;
  remindWithinShort: string;
  metersUnit: string;

  // Schedule fields
  reminderSection: string;
  reminderNearHint: string;
  reminderTime: string;
  reminderTimeHint: string;
  reminderDate: string;
  reminderDateHint: string;
  daysLabel: string;
  timeLabel: string;
  timeFrom: string;
  timeTo: string;
  oneDay: string;
  everyDay: string;
  daysOnce: string;
  weekdays: string;
  customDays: string;
  weekdaysMonFri: string;
  clearTimeA11y: string;
  everyDayLower: string;
  betweenTimes: string;
  atTime: string;
  untilTime: string;
  onDate: string;

  // Spot detail
  radiusLabel: string;
  statusActive: string;
  statusPaused: string;
  noDescription: string;
  locationLabel: string;
  triggeredLabel: string;
  createdLabel: string;
  reminderSchedule: string;
  anyTime: string;
  openInMaps: string;

  // Map picker
  searchLocationPlaceholder: string;
  loadingLocation: string;
  lookingUpAddress: string;
  setThisLocation: string;
  zoomInA11y: string;
  zoomOutA11y: string;

  // Location banner
  backgroundLocationWarning: string;
  locationServicesOff: string;
  locationPermissionDenied: string;
  couldNotReadLocation: string;
  turnOnLocationServices: string;
  locationPermissionRequired: string;

  // Alarm
  spotAlarm: string;
  spotAlarmEyebrow: string;
  nearSpotsTitle: string;
  nearSpotsSubtitle: string;
  enteredSpotArea: string;
  viewSpot: string;
  viewSpotDetailsA11y: string;
  dismissAlarmA11y: string;
  viewSpotA11y: string;
  nearbySpotsNotificationTitle: string;
  nearbySpotsMore: string;
  spotFallback: string;
  alarmChannelName: string;
  alarmChannelDescription: string;
  fullScreenAlarms: string;
  fullScreenAlarmsSheetTitle: string;
  fullScreenAlarmsSheetBody: string;
  fullScreenIntentOptTitle: string;
  fullScreenIntentOptBody: string;

  // Overlap / battery
  overlappingRangeTitle: string;
  overlappingRangeBody: string;
  saveAnyway: string;
  goBackAction: string;
  batteryOptTitle: string;
  batteryOptBody: string;

  // Relative time
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
};

export const en: AppTranslations = {
  cancel: 'Cancel',
  delete: 'Delete',
  moreOptions: 'More options',
  edit: 'Edit',
  save: 'Save',
  discard: 'Discard',
  confirm: 'Confirm',
  optional: '(optional)',
  optionalLabel: 'Optional',
  anytime: 'Anytime',
  on: 'On',
  off: 'Off',
  notSet: 'Not set',
  goBack: 'Go back',
  dismiss: 'Dismiss',
  close: 'Close',
  continue: 'Continue',
  done: 'Done',
  enable: 'Enable',
  openSettings: 'Open Settings',
  openSettingsShort: 'Open settings',
  gotIt: 'Got it',
  selectAll: 'Select all',
  selectAllShort: 'All',
  deselectAll: 'Deselect all',
  selectedCount: '{count} selected',
  notNow: 'Not Now',

  tabHome: 'Home',
  tabCalendar: 'Calendar',
  tabHistory: 'History',
  tabText: 'Text',
  spotsTitle: 'Spots',
  calendarTitle: 'Calendar',
  historyTitle: 'History',
  textTitle: 'Text',
  settingsTitle: 'Settings',
  newSpotTitle: 'New Spot',
  spotDetailsTitle: 'Spot Details',
  activeOfTotal: '{active} of {total} active',
  upToActiveSpots: 'Up to {count} active spots',

  calendarNoReminders: 'No reminders scheduled',
  calendarReminderCount: '{count} reminder(s) scheduled',
  calendarEmptyHint: 'Spots with a date or time window for this day will show up here.',
  calendarPreviousMonthA11y: 'Previous month',
  calendarNextMonthA11y: 'Next month',

  textRemindNearby: 'Remind me when I am nearby "{title}"',
  textRemindNearbyWithDescription: 'Remind me when I am nearby "{title}" to do "{description}"',
  textEmptyTitle: 'No active reminders',
  textEmptySubtitle: 'Turn on a spot to see its reminder text here.',

  sectionProfile: 'PROFILE',
  sectionApplication: 'APPLICATION',
  sectionSupport: 'SUPPORT',
  sectionDataPrivacy: 'DATA & PRIVACY',
  notifications: 'Notifications',
  locationAccess: 'Location Access',
  language: 'Language',
  theme: 'Theme',
  signUp: 'Sign Up',
  signUpTitle: 'Join the list',
  signUpBody:
    'You can contact us to be on the listed people. We will add you when a spot opens up.',
  howItWorks: 'How it Works',
  contactUs: 'Contact Us',
  contactUsPhone: '+49 173 866 347 4',
  privacy: 'Privacy',
  batteryUsage: 'Battery Usage',
  statusEnabled: 'Enabled',
  statusDisabled: 'Disabled',
  statusWhileInUse: 'While in use',
  statusAlways: 'Always',
  statusDenied: 'Denied',
  statusOff: 'Off',
  languageEnglish: 'English',
  languageGerman: 'German',
  languageArabic: 'Arabic',
  chooseLanguage: 'Language',
  themeDefault: 'Sky mood',
  themeDucky: 'Ducky mood',
  themeNight: 'Night mood',
  chooseTheme: 'Theme',
  howItWorksTitle: 'How it Works',
  howItWorksStep1Title: '1. Add a spot',
  howItWorksStep1Body: 'Pick a place on the map, give it a name, and save your location reminder.',
  howItWorksStep2Title: '2. Set date or time',
  howItWorksStep2Body:
    'Optionally choose when the reminder should be active — a date, a time window, or leave it always on.',
  howItWorksStep3Title: "3. You're ready to go",
  howItWorksStep3Body: "That's it. Spot will notify you when you arrive nearby — no extra steps needed.",
  privacyTitle: '100% Private & Local',
  privacyBody:
    'Your location is never saved to the cloud, never uploaded to our servers, and never shared with anyone. Reminders are triggered securely and locally on your device.',
  batteryTitle: 'Battery Efficient',
  batteryBody:
    "Does this drain your battery? No! We do not continuously track your GPS. The app relies on the system's geofencing to wake up only when you enter or leave a defined boundary.",
  notificationsSheetTitle: 'Enable Notifications',
  notificationsSheetBody:
    'Spot needs notification access to alert you when you arrive at a saved location — even when the app is in the background.',
  locationSheetTitle: 'Enable Location Access',
  locationSheetBody:
    'Spot uses your location to detect when you enter a saved place. Background access lets reminders work while the app is closed.',

  onboardingTitle: 'Welcome to Spot',
  onboardingSubtitle:
    'Allow a couple of permissions so location reminders can work on your device.',
  onboardingContinue: 'Get started',

  emptyTitle: 'No upcoming spot alarms',
  emptySubtitle: "Save a location and get notified when you're nearby.",
  emptyCta: 'Create your first spot',

  deleteSpotsTitle: 'Delete spots',
  deleteSpotConfirmOne: 'Delete this spot? This cannot be undone.',
  deleteSpotsConfirmMany: 'Delete {count} spots? This cannot be undone.',
  selectSpotsToDelete: 'Select spots to delete',
  deleteSpotA11y: 'Delete spot',
  addNewSpotA11y: 'Add new spot',
  turnOnSpots: 'Turn on',
  turnOffSpots: 'Turn off',
  spotLimitTitle: 'Spot limit reached',
  spotLimitMessage:
    'Maximum of 5 active spots allowed to optimize background battery performance.',

  historyEmptyTitle: 'No history yet',
  historyEmptySubtitle: 'Triggered spots will appear here.',
  deleteHistoryTitle: 'Delete history',
  deleteHistoryConfirmOne: 'Delete this history entry? This cannot be undone.',
  deleteHistoryConfirmMany: 'Delete {count} history entries? This cannot be undone.',
  selectEntriesToDelete: 'Select entries to delete',
  deleteHistoryEntryA11y: 'Delete history entry',
  spotUnavailableTitle: 'Spot unavailable',
  spotUnavailableBody:
    'This history entry does not have enough location data to show details.',

  selectedLocation: 'SELECTED LOCATION',
  fieldTitle: 'TITLE',
  fieldDescription: 'DESCRIPTION',
  descriptionLabel: 'Description',
  reminderTimeLabel: 'Reminder time',
  reminderDateLabel: 'Reminder date',
  titlePlaceholder: 'e.g. Secret Lookout',
  descriptionPlaceholder: 'Add an optional description (e.g., best at sunset)…',
  descriptionPlaceholderShort: 'Add an optional description…',
  reminderRange: 'REMINDER RANGE',
  reminderDistance: 'DISTANCE',
  rangeHint: "You'll be reminded when you're within {meters} meters of this spot.",
  remindWithinShort: 'Remind me within {meters} m',
  metersUnit: '{meters} m',

  reminderSection: 'REMINDER',
  reminderNearHint: "Get reminded when you're near this spot",
  reminderTime: 'REMINDER TIME',
  reminderTimeHint: 'Only remind when you are at this spot during these hours.',
  reminderDate: 'REMINDER DATE',
  reminderDateHint: 'Limit reminders to one day, every day, or selected weekdays.',
  daysLabel: 'DAYS',
  timeLabel: 'TIME',
  timeFrom: 'From',
  timeTo: 'To',
  oneDay: 'One day',
  everyDay: 'Every day',
  daysOnce: 'Once',
  weekdays: 'Weekdays',
  customDays: 'Custom',
  weekdaysMonFri: '{start}–{end}',
  clearTimeA11y: 'Clear time',
  everyDayLower: 'every day',
  betweenTimes: 'Between {start} and {end}',
  atTime: 'At {time}',
  untilTime: 'Until {time}',
  onDate: 'on {date}',

  radiusLabel: '{meters} m radius',
  statusActive: 'Active',
  statusPaused: 'Paused',
  noDescription: 'No description added',
  locationLabel: 'Location',
  triggeredLabel: 'Triggered',
  createdLabel: 'Created',
  reminderSchedule: 'Reminder schedule',
  anyTime: 'Any time',
  openInMaps: 'Open in Maps',

  searchLocationPlaceholder: 'Search for a location…',
  loadingLocation: 'Loading location…',
  lookingUpAddress: 'Looking up address…',
  setThisLocation: 'Set this location',
  zoomInA11y: 'Zoom in',
  zoomOutA11y: 'Zoom out',

  backgroundLocationWarning:
    "Background location wasn't granted. Nearby reminders may not work when the app isn't open.",
  locationServicesOff: 'Location services are turned off on this device.',
  locationPermissionDenied:
    'Location permission was denied. Allow location access to save spots and get nearby alerts.',
  couldNotReadLocation: 'Could not read current location.',
  turnOnLocationServices: 'Turn on location services to use your current position.',
  locationPermissionRequired: 'Location permission is required to use your current position.',

  spotAlarm: 'Spot Alarm',
  spotAlarmEyebrow: 'Spot alarm',
  nearSpotsTitle: "You're near {count} spots",
  nearSpotsSubtitle: 'Tap a spot for details, or dismiss to stop the alarm.',
  enteredSpotArea: 'You entered a saved spot area.',
  viewSpot: 'View spot',
  viewSpotDetailsA11y: 'View spot details',
  dismissAlarmA11y: 'Dismiss alarm',
  viewSpotA11y: 'View {title}',
  nearbySpotsNotificationTitle: '{count} nearby spots',
  nearbySpotsMore: '{list} +{extra} more',
  spotFallback: 'Spot',
  alarmChannelName: 'Spot alarms',
  alarmChannelDescription: 'Ringtone-style reminders when you enter a saved spot area.',
  fullScreenAlarms: 'Full-screen alarms',
  fullScreenAlarmsSheetTitle: 'Full-screen alarms',
  fullScreenAlarmsSheetBody:
    'Allow Spot to show Dismiss and View spot over the lock screen, like a clock alarm.\n\nOn Android 14+, open Settings and turn on full-screen notifications for Spot.',
  fullScreenIntentOptTitle: 'Show alarms on the lock screen',
  fullScreenIntentOptBody:
    'Spot needs full-screen notification access to show Dismiss and View spot when your phone is locked.\n\nThis is the same permission clock apps use.',

  overlappingRangeTitle: 'Overlapping range',
  overlappingRangeBody:
    'This overlaps with "{title}" ({meters} m range). When you\'re nearby, reminders in the same area are grouped into one alarm.',
  saveAnyway: 'Save anyway',
  goBackAction: 'Go back',
  batteryOptTitle: 'Improve Pocket Reminders',
  batteryOptBody:
    'For instant notifications when your screen is off, set Spot to "Unrestricted" in your battery settings.\n\nThis prevents Android from delaying alerts while the phone is in your pocket.',

  justNow: 'Just now',
  minutesAgo: '{count}m ago',
  hoursAgo: '{count}h ago',
  daysAgo: '{count}d ago',
};

export const de: AppTranslations = {
  cancel: 'Abbrechen',
  delete: 'Löschen',
  moreOptions: 'Mehr Optionen',
  edit: 'Bearbeiten',
  save: 'Speichern',
  discard: 'Verwerfen',
  confirm: 'Bestätigen',
  optional: '(optional)',
  optionalLabel: 'Optional',
  anytime: 'Jederzeit',
  on: 'An',
  off: 'Aus',
  notSet: 'Nicht festgelegt',
  goBack: 'Zurück',
  dismiss: 'Schließen',
  close: 'Schließen',
  continue: 'Weiter',
  done: 'Fertig',
  enable: 'Aktivieren',
  openSettings: 'Einstellungen öffnen',
  openSettingsShort: 'Einstellungen öffnen',
  gotIt: 'Verstanden',
  selectAll: 'Alle auswählen',
  selectAllShort: 'Alle',
  deselectAll: 'Auswahl aufheben',
  selectedCount: '{count} ausgewählt',
  notNow: 'Nicht jetzt',

  tabHome: 'Start',
  tabCalendar: 'Kalender',
  tabHistory: 'Verlauf',
  tabText: 'Text',
  spotsTitle: 'Spots',
  calendarTitle: 'Kalender',
  historyTitle: 'Verlauf',
  textTitle: 'Text',
  settingsTitle: 'Einstellungen',
  newSpotTitle: 'Neuer Spot',
  spotDetailsTitle: 'Spot-Details',
  activeOfTotal: '{active} von {total} aktiv',
  upToActiveSpots: 'Bis zu {count} aktive Spots',

  calendarNoReminders: 'Keine Erinnerungen geplant',
  calendarReminderCount: '{count} Erinnerung(en) geplant',
  calendarEmptyHint:
    'Spots mit Datum oder Zeitfenster für diesen Tag erscheinen hier.',
  calendarPreviousMonthA11y: 'Vorheriger Monat',
  calendarNextMonthA11y: 'Nächster Monat',

  textRemindNearby: 'Erinnere mich, wenn ich in der Nähe von „{title}" bin',
  textRemindNearbyWithDescription:
    'Erinnere mich, wenn ich in der Nähe von „{title}" bin, um „{description}" zu erledigen',
  textEmptyTitle: 'Keine aktiven Erinnerungen',
  textEmptySubtitle: 'Aktiviere einen Spot, um den Erinnerungstext hier zu sehen.',

  sectionProfile: 'PROFIL',
  sectionApplication: 'ANWENDUNG',
  sectionSupport: 'SUPPORT',
  sectionDataPrivacy: 'DATEN & DATENSCHUTZ',
  notifications: 'Benachrichtigungen',
  locationAccess: 'Standortzugriff',
  language: 'Sprache',
  theme: 'Design',
  signUp: 'Registrieren',
  signUpTitle: 'Auf die Liste',
  signUpBody:
    'Du kannst uns kontaktieren, um auf die Liste der Personen aufgenommen zu werden. Wir melden uns, sobald ein Platz frei wird.',
  howItWorks: "So funktioniert's",
  contactUs: 'Kontakt',
  contactUsPhone: '+49 173 866 347 4',
  privacy: 'Datenschutz',
  batteryUsage: 'Akkuverbrauch',
  statusEnabled: 'Aktiviert',
  statusDisabled: 'Deaktiviert',
  statusWhileInUse: 'Bei Nutzung',
  statusAlways: 'Immer',
  statusDenied: 'Verweigert',
  statusOff: 'Aus',
  languageEnglish: 'Englisch',
  languageGerman: 'Deutsch',
  languageArabic: 'Arabisch',
  chooseLanguage: 'Sprache',
  themeDefault: 'Sky Mood',
  themeDucky: 'Ducky Mood',
  themeNight: 'Night Mood',
  chooseTheme: 'Design',
  howItWorksTitle: "So funktioniert's",
  howItWorksStep1Title: '1. Spot hinzufügen',
  howItWorksStep1Body:
    'Wähle einen Ort auf der Karte, gib ihm einen Namen und speichere deine Standort-Erinnerung.',
  howItWorksStep2Title: '2. Datum oder Uhrzeit festlegen',
  howItWorksStep2Body:
    'Optional kannst du festlegen, wann die Erinnerung aktiv sein soll — ein Datum, ein Zeitfenster oder dauerhaft.',
  howItWorksStep3Title: "3. Fertig — los geht's",
  howItWorksStep3Body:
    "Das war's. Spot benachrichtigt dich, wenn du in der Nähe ankommst — keine weiteren Schritte nötig.",
  privacyTitle: '100% privat & lokal',
  privacyBody:
    'Dein Standort wird nie in der Cloud gespeichert, nie auf unsere Server hochgeladen und nie mit jemandem geteilt. Erinnerungen werden sicher und lokal auf deinem Gerät ausgelöst.',
  batteryTitle: 'Akkuschonend',
  batteryBody:
    'Entlädt das den Akku? Nein! Wir tracken dein GPS nicht dauerhaft. Die App nutzt das System-Geofencing und wacht nur auf, wenn du eine festgelegte Grenze betrittst oder verlässt.',
  notificationsSheetTitle: 'Benachrichtigungen aktivieren',
  notificationsSheetBody:
    'Spot benötigt Benachrichtigungen, um dich zu warnen, wenn du an einem gespeicherten Ort ankommst — auch wenn die App im Hintergrund ist.',
  locationSheetTitle: 'Standortzugriff aktivieren',
  locationSheetBody:
    'Spot nutzt deinen Standort, um zu erkennen, wann du einen gespeicherten Ort betrittst. Hintergrundzugriff lässt Erinnerungen auch bei geschlossener App funktionieren.',

  onboardingTitle: 'Willkommen bei Spot',
  onboardingSubtitle:
    'Erlaube ein paar Berechtigungen, damit Standort-Erinnerungen auf deinem Gerät funktionieren.',
  onboardingContinue: 'Loslegen',

  emptyTitle: 'Keine Spot-Alarme geplant',
  emptySubtitle: 'Speichere einen Ort und werde benachrichtigt, wenn du in der Nähe bist.',
  emptyCta: 'Ersten Spot erstellen',

  deleteSpotsTitle: 'Spots löschen',
  deleteSpotConfirmOne: 'Diesen Spot löschen? Das kann nicht rückgängig gemacht werden.',
  deleteSpotsConfirmMany: '{count} Spots löschen? Das kann nicht rückgängig gemacht werden.',
  selectSpotsToDelete: 'Spots zum Löschen auswählen',
  deleteSpotA11y: 'Spot löschen',
  addNewSpotA11y: 'Neuen Spot hinzufügen',
  turnOnSpots: 'Einschalten',
  turnOffSpots: 'Ausschalten',
  spotLimitTitle: 'Spot-Limit erreicht',
  spotLimitMessage:
    'Maximal 5 aktive Spots erlaubt, um den Akkuverbrauch im Hintergrund zu optimieren.',

  historyEmptyTitle: 'Noch kein Verlauf',
  historyEmptySubtitle: 'Ausgelöste Spots erscheinen hier.',
  deleteHistoryTitle: 'Verlauf löschen',
  deleteHistoryConfirmOne:
    'Diesen Verlaufseintrag löschen? Das kann nicht rückgängig gemacht werden.',
  deleteHistoryConfirmMany:
    '{count} Verlaufseinträge löschen? Das kann nicht rückgängig gemacht werden.',
  selectEntriesToDelete: 'Einträge zum Löschen auswählen',
  deleteHistoryEntryA11y: 'Verlaufseintrag löschen',
  spotUnavailableTitle: 'Spot nicht verfügbar',
  spotUnavailableBody:
    'Dieser Verlaufseintrag enthält nicht genug Standortdaten, um Details anzuzeigen.',

  selectedLocation: 'AUSGEWÄHLTER ORT',
  fieldTitle: 'TITEL',
  fieldDescription: 'BESCHREIBUNG',
  descriptionLabel: 'Beschreibung',
  reminderTimeLabel: 'Erinnerungszeit',
  reminderDateLabel: 'Erinnerungsdatum',
  titlePlaceholder: 'z. B. Geheimer Aussichtspunkt',
  descriptionPlaceholder: 'Optionale Beschreibung hinzufügen (z. B. am besten bei Sonnenuntergang)…',
  descriptionPlaceholderShort: 'Optionale Beschreibung hinzufügen…',
  reminderRange: 'ERINNERUNGSBEREICH',
  reminderDistance: 'ENTFERNUNG',
  rangeHint: 'Du wirst erinnert, wenn du innerhalb von {meters} Metern von diesem Spot bist.',
  remindWithinShort: 'Erinnere mich innerhalb von {meters} m',
  metersUnit: '{meters} m',

  reminderSection: 'ERINNERUNG',
  reminderNearHint: 'Lass dich erinnern, wenn du in der Nähe bist',
  reminderTime: 'ERINNERUNGSZEIT',
  reminderTimeHint: 'Nur erinnern, wenn du zu diesen Zeiten an diesem Spot bist.',
  reminderDate: 'ERINNERUNGSDATUM',
  reminderDateHint: 'Erinnerungen auf einen Tag, jeden Tag oder ausgewählte Wochentage begrenzen.',
  daysLabel: 'TAGE',
  timeLabel: 'ZEIT',
  timeFrom: 'Von',
  timeTo: 'Bis',
  oneDay: 'Ein Tag',
  everyDay: 'Jeden Tag',
  daysOnce: 'Einmal',
  weekdays: 'Wochentage',
  customDays: 'Benutzerdefiniert',
  weekdaysMonFri: '{start}–{end}',
  clearTimeA11y: 'Zeit löschen',
  everyDayLower: 'jeden Tag',
  betweenTimes: 'Zwischen {start} und {end}',
  atTime: 'Um {time}',
  untilTime: 'Bis {time}',
  onDate: 'am {date}',

  radiusLabel: '{meters} m Radius',
  statusActive: 'Aktiv',
  statusPaused: 'Pausiert',
  noDescription: 'Keine Beschreibung hinzugefügt',
  locationLabel: 'Standort',
  triggeredLabel: 'Ausgelöst',
  createdLabel: 'Erstellt',
  reminderSchedule: 'Erinnerungsplan',
  anyTime: 'Jederzeit',
  openInMaps: 'In Karten öffnen',

  searchLocationPlaceholder: 'Nach einem Ort suchen…',
  loadingLocation: 'Standort wird geladen…',
  lookingUpAddress: 'Adresse wird ermittelt…',
  setThisLocation: 'Diesen Ort festlegen',
  zoomInA11y: 'Vergrößern',
  zoomOutA11y: 'Verkleinern',

  backgroundLocationWarning:
    'Hintergrund-Standort wurde nicht erlaubt. Erinnerungen in der Nähe funktionieren möglicherweise nicht, wenn die App geschlossen ist.',
  locationServicesOff: 'Standortdienste sind auf diesem Gerät deaktiviert.',
  locationPermissionDenied:
    'Standortberechtigung wurde verweigert. Erlaube den Standortzugriff, um Spots zu speichern und Benachrichtigungen in der Nähe zu erhalten.',
  couldNotReadLocation: 'Aktueller Standort konnte nicht gelesen werden.',
  turnOnLocationServices: 'Aktiviere die Standortdienste, um deine aktuelle Position zu nutzen.',
  locationPermissionRequired:
    'Standortberechtigung ist erforderlich, um deine aktuelle Position zu nutzen.',

  spotAlarm: 'Spot-Alarm',
  spotAlarmEyebrow: 'Spot-Alarm',
  nearSpotsTitle: 'Du bist in der Nähe von {count} Spots',
  nearSpotsSubtitle: 'Tippe auf einen Spot für Details oder schließe den Alarm.',
  enteredSpotArea: 'Du hast einen gespeicherten Spot-Bereich betreten.',
  viewSpot: 'Spot anzeigen',
  viewSpotDetailsA11y: 'Spot-Details anzeigen',
  dismissAlarmA11y: 'Alarm schließen',
  viewSpotA11y: '{title} anzeigen',
  nearbySpotsNotificationTitle: '{count} Spots in der Nähe',
  nearbySpotsMore: '{list} +{extra} weitere',
  spotFallback: 'Spot',
  alarmChannelName: 'Spot-Alarme',
  alarmChannelDescription:
    'Klingelton-Erinnerungen, wenn du einen gespeicherten Spot-Bereich betrittst.',
  fullScreenAlarms: 'Vollbild-Alarme',
  fullScreenAlarmsSheetTitle: 'Vollbild-Alarme',
  fullScreenAlarmsSheetBody:
    'Erlaube Spot, „Schließen“ und „Spot anzeigen“ über dem Sperrbildschirm zu zeigen — wie ein Wecker.\n\nUnter Android 14+ öffne die Einstellungen und aktiviere Vollbildbenachrichtigungen für Spot.',
  fullScreenIntentOptTitle: 'Alarme auf dem Sperrbildschirm zeigen',
  fullScreenIntentOptBody:
    'Spot braucht Zugriff auf Vollbildbenachrichtigungen, um „Schließen“ und „Spot anzeigen“ zu zeigen, wenn das Telefon gesperrt ist.\n\nDas ist dieselbe Berechtigung, die Wecker-Apps verwenden.',

  overlappingRangeTitle: 'Überlappender Bereich',
  overlappingRangeBody:
    'Dies überlappt mit „{title}“ ({meters} m Bereich). Wenn du in der Nähe bist, werden Erinnerungen im selben Gebiet zu einem Alarm zusammengefasst.',
  saveAnyway: 'Trotzdem speichern',
  goBackAction: 'Zurück',
  batteryOptTitle: 'Taschen-Erinnerungen verbessern',
  batteryOptBody:
    'Für sofortige Benachrichtigungen bei ausgeschaltetem Bildschirm stelle Spot in den Akku-Einstellungen auf „Uneingeschränkt“.\n\nSo verhindert Android, dass Alarme verzögert werden, während das Handy in der Tasche ist.',

  justNow: 'Gerade eben',
  minutesAgo: 'vor {count} Min.',
  hoursAgo: 'vor {count} Std.',
  daysAgo: 'vor {count} T.',
};

export const ar: AppTranslations = {
  cancel: 'إلغاء',
  delete: 'حذف',
  moreOptions: 'المزيد من الخيارات',
  edit: 'تعديل',
  save: 'حفظ',
  discard: 'تجاهل',
  confirm: 'تأكيد',
  optional: '(اختياري)',
  optionalLabel: 'اختياري',
  anytime: 'في أي وقت',
  on: 'تشغيل',
  off: 'إيقاف',
  notSet: 'غير محدد',
  goBack: 'رجوع',
  dismiss: 'إغلاق',
  close: 'إغلاق',
  continue: 'متابعة',
  done: 'تم',
  enable: 'تفعيل',
  openSettings: 'فتح الإعدادات',
  openSettingsShort: 'فتح الإعدادات',
  gotIt: 'حسناً',
  selectAll: 'تحديد الكل',
  selectAllShort: 'الكل',
  deselectAll: 'إلغاء التحديد',
  selectedCount: '{count} محدد',
  notNow: 'ليس الآن',

  tabHome: 'الرئيسية',
  tabCalendar: 'التقويم',
  tabHistory: 'السجل',
  tabText: 'النص',
  spotsTitle: 'الأماكن',
  calendarTitle: 'التقويم',
  historyTitle: 'السجل',
  textTitle: 'النص',
  settingsTitle: 'الإعدادات',
  newSpotTitle: 'مكان جديد',
  spotDetailsTitle: 'تفاصيل المكان',
  activeOfTotal: '{active} من {total} نشط',
  upToActiveSpots: 'حتى {count} أماكن نشطة',

  calendarNoReminders: 'لا توجد تذكيرات مجدولة',
  calendarReminderCount: '{count} تذكير/تذكيرات مجدولة',
  calendarEmptyHint: 'ستظهر هنا الأماكن التي لها تاريخ أو فترة زمنية في هذا اليوم.',
  calendarPreviousMonthA11y: 'الشهر السابق',
  calendarNextMonthA11y: 'الشهر التالي',

  textRemindNearby: 'ذكّرني عندما أكون قرب "{title}"',
  textRemindNearbyWithDescription: 'ذكّرني عندما أكون قرب "{title}" لـ "{description}"',
  textEmptyTitle: 'لا توجد تذكيرات نشطة',
  textEmptySubtitle: 'فعّل مكاناً لعرض نص التذكير هنا.',

  sectionProfile: 'الملف الشخصي',
  sectionApplication: 'التطبيق',
  sectionSupport: 'الدعم',
  sectionDataPrivacy: 'البيانات والخصوصية',
  notifications: 'الإشعارات',
  locationAccess: 'الوصول إلى الموقع',
  language: 'اللغة',
  theme: 'المظهر',
  signUp: 'التسجيل',
  signUpTitle: 'انضم إلى القائمة',
  signUpBody:
    'يمكنك التواصل معنا لإضافتك إلى قائمة الأشخاص. سنضيفك عندما يتوفر مكان.',
  howItWorks: 'كيف يعمل',
  contactUs: 'اتصل بنا',
  contactUsPhone: '+49 173 866 347 4',
  privacy: 'الخصوصية',
  batteryUsage: 'استهلاك البطارية',
  statusEnabled: 'مفعّل',
  statusDisabled: 'معطّل',
  statusWhileInUse: 'أثناء الاستخدام',
  statusAlways: 'دائماً',
  statusDenied: 'مرفوض',
  statusOff: 'إيقاف',
  languageEnglish: 'الإنجليزية',
  languageGerman: 'الألمانية',
  languageArabic: 'العربية',
  chooseLanguage: 'اللغة',
  themeDefault: 'وضع السماء',
  themeDucky: 'وضع داكي',
  themeNight: 'وضع الليل',
  chooseTheme: 'المظهر',
  howItWorksTitle: 'كيف يعمل',
  howItWorksStep1Title: '١. أضف مكاناً',
  howItWorksStep1Body: 'اختر مكاناً على الخريطة، أعطِه اسماً، واحفظ تذكير الموقع.',
  howItWorksStep2Title: '٢. عيّن تاريخاً أو وقتاً',
  howItWorksStep2Body:
    'اختَر اختيارياً متى يكون التذكير نشطاً — تاريخ، فترة زمنية، أو اتركه دائماً.',
  howItWorksStep3Title: '٣. أنت جاهز',
  howItWorksStep3Body: 'هذا كل شيء. سينبهك Spot عند اقترابك — بدون خطوات إضافية.',
  privacyTitle: 'خاص ومحلي ١٠٠٪',
  privacyBody:
    'لا يُحفظ موقعك في السحابة أبداً، ولا يُرفع إلى خوادمنا، ولا يُشارك مع أحد. تُفعَّل التذكيرات بأمان محلياً على جهازك.',
  batteryTitle: 'موفّر للبطارية',
  batteryBody:
    'هل يستنزف البطارية؟ لا! نحن لا نتتبّع GPS باستمرار. يعتمد التطبيق على السياج الجغرافي للنظام ويستيقظ فقط عند دخولك أو خروجك من حدود محددة.',
  notificationsSheetTitle: 'تفعيل الإشعارات',
  notificationsSheetBody:
    'يحتاج Spot إلى الإشعارات لتنبيهك عند وصولك إلى مكان محفوظ — حتى عندما يكون التطبيق في الخلفية.',
  locationSheetTitle: 'تفعيل الوصول إلى الموقع',
  locationSheetBody:
    'يستخدم Spot موقعك لاكتشاف دخولك إلى مكان محفوظ. الوصول في الخلفية يتيح عمل التذكيرات والتطبيق مغلق.',

  onboardingTitle: 'مرحباً بك في Spot',
  onboardingSubtitle: 'اسمح ببعض الأذونات حتى تعمل تذكيرات الموقع على جهازك.',
  onboardingContinue: 'ابدأ',

  emptyTitle: 'لا توجد تنبيهات أماكن قادمة',
  emptySubtitle: 'احفظ موقعاً واحصل على إشعار عندما تكون قريباً.',
  emptyCta: 'أنشئ مكانك الأول',

  deleteSpotsTitle: 'حذف الأماكن',
  deleteSpotConfirmOne: 'حذف هذا المكان؟ لا يمكن التراجع عن ذلك.',
  deleteSpotsConfirmMany: 'حذف {count} أماكن؟ لا يمكن التراجع عن ذلك.',
  selectSpotsToDelete: 'حدد الأماكن للحذف',
  deleteSpotA11y: 'حذف المكان',
  addNewSpotA11y: 'إضافة مكان جديد',
  turnOnSpots: 'تشغيل',
  turnOffSpots: 'إيقاف',
  spotLimitTitle: 'تم بلوغ حد الأماكن',
  spotLimitMessage:
    'يُسمح بحد أقصى ٥ أماكن نشطة لتحسين أداء البطارية في الخلفية.',

  historyEmptyTitle: 'لا يوجد سجل بعد',
  historyEmptySubtitle: 'ستظهر الأماكن المُفعَّلة هنا.',
  deleteHistoryTitle: 'حذف السجل',
  deleteHistoryConfirmOne: 'حذف إدخال السجل هذا؟ لا يمكن التراجع عن ذلك.',
  deleteHistoryConfirmMany: 'حذف {count} إدخالات سجل؟ لا يمكن التراجع عن ذلك.',
  selectEntriesToDelete: 'حدد الإدخالات للحذف',
  deleteHistoryEntryA11y: 'حذف إدخال السجل',
  spotUnavailableTitle: 'المكان غير متاح',
  spotUnavailableBody: 'لا يحتوي إدخال السجل هذا على بيانات موقع كافية لعرض التفاصيل.',

  selectedLocation: 'الموقع المحدد',
  fieldTitle: 'العنوان',
  fieldDescription: 'الوصف',
  descriptionLabel: 'الوصف',
  reminderTimeLabel: 'وقت التذكير',
  reminderDateLabel: 'تاريخ التذكير',
  titlePlaceholder: 'مثلاً: نقطة مراقبة سرية',
  descriptionPlaceholder: 'أضف وصفاً اختيارياً (مثلاً، الأفضل عند الغروب)…',
  descriptionPlaceholderShort: 'أضف وصفاً اختيارياً…',
  reminderRange: 'نطاق التذكير',
  reminderDistance: 'المسافة',
  rangeHint: 'سيتم تذكيرك عندما تكون ضمن {meters} متراً من هذا المكان.',
  remindWithinShort: 'ذكّرني ضمن {meters} م',
  metersUnit: '{meters} م',

  reminderSection: 'التذكير',
  reminderNearHint: 'احصل على تذكير عندما تكون قريباً من هذا المكان',
  reminderTime: 'وقت التذكير',
  reminderTimeHint: 'ذكّر فقط عندما تكون في هذا المكان خلال هذه الساعات.',
  reminderDate: 'تاريخ التذكير',
  reminderDateHint: 'قيّد التذكيرات بيوم واحد، أو كل يوم، أو أيام أسبوع محددة.',
  daysLabel: 'الأيام',
  timeLabel: 'الوقت',
  timeFrom: 'من',
  timeTo: 'إلى',
  oneDay: 'يوم واحد',
  everyDay: 'كل يوم',
  daysOnce: 'مرة',
  weekdays: 'أيام الأسبوع',
  customDays: 'مخصص',
  weekdaysMonFri: '{start}–{end}',
  clearTimeA11y: 'مسح الوقت',
  everyDayLower: 'كل يوم',
  betweenTimes: 'بين {start} و {end}',
  atTime: 'في {time}',
  untilTime: 'حتى {time}',
  onDate: 'في {date}',

  radiusLabel: 'نصف قطر {meters} م',
  statusActive: 'نشط',
  statusPaused: 'متوقف',
  noDescription: 'لم تتم إضافة وصف',
  locationLabel: 'الموقع',
  triggeredLabel: 'تم التفعيل',
  createdLabel: 'تم الإنشاء',
  reminderSchedule: 'جدول التذكير',
  anyTime: 'أي وقت',
  openInMaps: 'فتح في الخرائط',

  searchLocationPlaceholder: 'ابحث عن موقع…',
  loadingLocation: 'جارٍ تحميل الموقع…',
  lookingUpAddress: 'جارٍ البحث عن العنوان…',
  setThisLocation: 'تعيين هذا الموقع',
  zoomInA11y: 'تكبير',
  zoomOutA11y: 'تصغير',

  backgroundLocationWarning:
    'لم يُمنح إذن الموقع في الخلفية. قد لا تعمل التذكيرات القريبة عندما يكون التطبيق مغلقاً.',
  locationServicesOff: 'خدمات الموقع متوقفة على هذا الجهاز.',
  locationPermissionDenied:
    'تم رفض إذن الموقع. اسمح بالوصول إلى الموقع لحفظ الأماكن والحصول على تنبيهات قريبة.',
  couldNotReadLocation: 'تعذر قراءة الموقع الحالي.',
  turnOnLocationServices: 'فعّل خدمات الموقع لاستخدام موقعك الحالي.',
  locationPermissionRequired: 'إذن الموقع مطلوب لاستخدام موقعك الحالي.',

  spotAlarm: 'تنبيه المكان',
  spotAlarmEyebrow: 'تنبيه المكان',
  nearSpotsTitle: 'أنت قرب {count} أماكن',
  nearSpotsSubtitle: 'اضغط على مكان للتفاصيل، أو أغلق لإيقاف التنبيه.',
  enteredSpotArea: 'دخلت منطقة مكان محفوظ.',
  viewSpot: 'عرض المكان',
  viewSpotDetailsA11y: 'عرض تفاصيل المكان',
  dismissAlarmA11y: 'إغلاق التنبيه',
  viewSpotA11y: 'عرض {title}',
  nearbySpotsNotificationTitle: '{count} أماكن قريبة',
  nearbySpotsMore: '{list} +{extra} أخرى',
  spotFallback: 'مكان',
  alarmChannelName: 'تنبيهات الأماكن',
  alarmChannelDescription: 'تذكيرات بنغمة رنين عند دخولك منطقة مكان محفوظ.',
  fullScreenAlarms: 'تنبيهات ملء الشاشة',
  fullScreenAlarmsSheetTitle: 'تنبيهات ملء الشاشة',
  fullScreenAlarmsSheetBody:
    'اسمح لـ Spot بإظهار إغلاق وعرض المكان فوق شاشة القفل، مثل المنبّه.\n\nعلى أندرويد 14 فما فوق، افتح الإعدادات وفعّل إشعارات ملء الشاشة لتطبيق Spot.',
  fullScreenIntentOptTitle: 'إظهار التنبيهات على شاشة القفل',
  fullScreenIntentOptBody:
    'يحتاج Spot إلى إذن إشعارات ملء الشاشة لإظهار إغلاق وعرض المكان عندما يكون الهاتف مقفلاً.\n\nهذا نفس الإذن الذي تستخدمه تطبيقات المنبّه.',

  overlappingRangeTitle: 'نطاق متداخل',
  overlappingRangeBody:
    'يتداخل هذا مع "{title}" (نطاق {meters} م). عندما تكون قريباً، تُجمَّع التذكيرات في نفس المنطقة في تنبيه واحد.',
  saveAnyway: 'حفظ على أي حال',
  goBackAction: 'رجوع',
  batteryOptTitle: 'تحسين تذكيرات الجيب',
  batteryOptBody:
    'للإشعارات الفورية عندما تكون الشاشة مغلقة، اضبط Spot على "غير مقيّد" في إعدادات البطارية.\n\nهذا يمنع أندرويد من تأخير التنبيهات أثناء وجود الهاتف في جيبك.',

  justNow: 'الآن',
  minutesAgo: 'منذ {count} د',
  hoursAgo: 'منذ {count} س',
  daysAgo: 'منذ {count} ي',
};

export const translations: Record<AppLanguage, AppTranslations> = {
  en,
  de,
  ar,
};

/** Kept for callers that still import the old name. */
export type SettingsTranslations = AppTranslations;

let cachedLanguage: AppLanguage = 'en';

export function setCachedLanguage(language: AppLanguage): void {
  cachedLanguage = language;
}

export function getCachedLanguage(): AppLanguage {
  return cachedLanguage;
}

export function getT(language?: AppLanguage): AppTranslations {
  return translations[language ?? cachedLanguage];
}

export function localeTag(language?: AppLanguage): string {
  const lang = language ?? cachedLanguage;
  if (lang === 'de') return 'de-DE';
  if (lang === 'ar') return 'ar';
  return 'en-US';
}

export function isRtlLanguage(language?: AppLanguage): boolean {
  return (language ?? cachedLanguage) === 'ar';
}

export function fill(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
