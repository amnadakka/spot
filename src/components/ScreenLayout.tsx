import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';

type ScreenLayoutProps = {
  children: ReactNode;
  /** When true, only the top inset is applied here; bottom is handled elsewhere (e.g. tab bar). */
  bottomInsetHandledExternally?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Root screen shell that keeps content below the status bar / notch on all devices.
 * Uses react-native-safe-area-context (required for Android edge-to-edge).
 */
export default function ScreenLayout({
  children,
  bottomInsetHandledExternally = false,
  style,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.backdrop}>
      <View style={[styles.statusBarFill, { height: insets.top }]} />
      <View
        style={[
          styles.content,
          style,
          !bottomInsetHandledExternally && insets.bottom > 0
            ? { paddingBottom: insets.bottom }
            : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

type BottomInsetSpacerProps = {
  minPadding?: number;
};

/** Adds bottom safe-area padding for footers, tab bars, and fixed bottom actions. */
export function BottomInsetSpacer({ minPadding = 0 }: BottomInsetSpacerProps) {
  const insets = useSafeAreaInsets();
  const height = Math.max(insets.bottom, minPadding);

  if (height <= 0) {
    return null;
  }

  return <View style={{ height }} />;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBarFill: {
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
