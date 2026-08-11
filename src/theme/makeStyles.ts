import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from './ThemeContext';
import type { ColorPalette } from './colors';

type NamedStyles = { [key: string]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles>(factory: (colors: ColorPalette) => T) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)) as T, [colors]);
  };
}
