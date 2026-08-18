import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { getCurrentCoordinates } from '../services/getCurrentCoordinates';
import {
  createPlacesSessionToken,
  fetchPlaceDetails,
  fetchPlaceSuggestions,
  type PlaceSuggestion,
} from '../services/placesAutocomplete';
import { reverseGeocode } from '../services/reverseGeocode';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing } from '../theme/spacing';

import CenterPinMapPicker, { type MapCoordinate } from './CenterPinMapPicker';

export type PickedLocation = MapCoordinate & {
  address: string;
};

type MapPickerScreenProps = {
  onLocationPicked: (location: PickedLocation) => void;
};

export default function MapPickerScreen({ onLocationPicked }: MapPickerScreenProps) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const styles = useStyles();
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(null);
  const [addressLabel, setAddressLabel] = useState(t.loadingLocation);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [mapFocusToken, setMapFocusToken] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef(createPlacesSessionToken());
  const searchRequestIdRef = useRef(0);
  const coordinateRef = useRef<MapCoordinate | null>(null);
  const [suggestionsMaxHeight, setSuggestionsMaxHeight] = useState(280);
  const suggestionsOpen = showSuggestions && suggestions.length > 0;

  useEffect(() => {
    coordinateRef.current = coordinate;
  }, [coordinate]);

  const updateAddress = useCallback(async (next: MapCoordinate) => {
    setGeocoding(true);
    try {
      const address = await reverseGeocode(next.latitude, next.longitude);
      setAddressLabel(address);
    } finally {
      setGeocoding(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await getCurrentCoordinates();
        if (!cancelled) {
          setCoordinate(next);
          await updateAddress(next);
        }
      } catch {
        if (!cancelled) {
          const fallback = { latitude: 40.7128, longitude: -74.006 };
          setCoordinate(fallback);
          await updateAddress(fallback);
        }
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [updateAddress]);

  const handleCoordinateChange = useCallback(
    (next: MapCoordinate) => {
      setCoordinate(next);
      void updateAddress(next);
    },
    [updateAddress],
  );

  const handleRefreshLocation = useCallback(async () => {
    setMapLoading(true);
    try {
      const next = await getCurrentCoordinates();
      setCoordinate(next);
      setMapFocusToken((token) => token + 1);
      await updateAddress(next);
    } catch {
      // Keep current map position.
    } finally {
      setMapLoading(false);
    }
  }, [updateAddress]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(text.trim().length > 0);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    searchTimer.current = setTimeout(() => {
      const bias = coordinateRef.current;
      void fetchPlaceSuggestions(text, {
        sessionToken: sessionTokenRef.current,
        locationBias: bias
          ? {
              latitude: bias.latitude,
              longitude: bias.longitude,
            }
          : undefined,
      }).then((nextSuggestions) => {
        if (requestId !== searchRequestIdRef.current) {
          return;
        }
        setSuggestions(nextSuggestions);
      });
    }, 350);
  }, []);

  const handleSuggestionPress = useCallback(async (result: PlaceSuggestion) => {
    setQuery(result.label);
    setShowSuggestions(false);
    setSuggestions([]);
    setResolvingPlace(true);

    try {
      const details = await fetchPlaceDetails(result.placeId, sessionTokenRef.current);
      sessionTokenRef.current = createPlacesSessionToken();

      if (!details) {
        return;
      }

      const next = { latitude: details.latitude, longitude: details.longitude };
      setAddressLabel(details.address);
      setCoordinate(next);
      setMapFocusToken((token) => token + 1);
    } finally {
      setResolvingPlace(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!coordinate) {
      return;
    }

    setConfirming(true);
    try {
      const existingAddress =
        addressLabel &&
        addressLabel !== t.loadingLocation &&
        addressLabel !== t.lookingUpAddress
          ? addressLabel
          : null;
      const address =
        existingAddress ?? (await reverseGeocode(coordinate.latitude, coordinate.longitude));
      onLocationPicked({ ...coordinate, address });
    } finally {
      setConfirming(false);
    }
  }, [addressLabel, coordinate, onLocationPicked, t.loadingLocation, t.lookingUpAddress]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchLocationPlaceholder}
            placeholderTextColor={colors.slate400}
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setShowSuggestions(query.trim().length > 0)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {resolvingPlace ? <ActivityIndicator size="small" color={colors.accent} /> : null}
          {query.length > 0 && !resolvingPlace ? (
            <Pressable
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={16} color={colors.slate400} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.mapArea}>
        {coordinate ? (
          <CenterPinMapPicker
            coordinate={coordinate}
            onCoordinateChange={handleCoordinateChange}
            addressLabel={geocoding ? t.lookingUpAddress : addressLabel}
            onRefreshLocation={() => void handleRefreshLocation()}
            loading={mapLoading}
            focusToken={mapFocusToken}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        )}

        {suggestionsOpen ? (
          <View
            style={styles.suggestionsOverlay}
            onLayout={(event) => {
              const nextHeight = Math.floor(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== suggestionsMaxHeight) {
                setSuggestionsMaxHeight(nextHeight);
              }
            }}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowSuggestions(false)}
            />
            <View style={styles.suggestions}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                nestedScrollEnabled
                style={[styles.suggestionsList, { maxHeight: suggestionsMaxHeight }]}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}
                    onPress={() => void handleSuggestionPress(item)}
                  >
                    <Ionicons name="location-outline" size={14} color={colors.accent} />
                    <View style={styles.suggestionTextWrap}>
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.secondaryLabel ? (
                        <Text style={styles.suggestionSecondary} numberOfLines={1}>
                          {item.secondaryLabel}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.confirmBtnPressed,
            (!coordinate || confirming) && styles.confirmBtnDisabled,
          ]}
          onPress={() => void handleConfirm()}
          disabled={!coordinate || confirming}
        >
          {confirming ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.confirmLabel}>{t.setThisLocation}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: {
    flex: 1,
    paddingTop: spacing.md,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.slate700,
    padding: 0,
  },
  suggestionsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 12,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.slate50,
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 2,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate700,
  },
  suggestionSecondary: {
    fontSize: 12,
    color: colors.slate400,
  },
  mapArea: {
    flex: 1,
    marginHorizontal: spacing.lg,
    zIndex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    borderRadius: radii.xl,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmLabel: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
}));
