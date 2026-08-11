export type ColorPalette = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  /** Interactive chrome (icons, selected borders); equals primary in Default. */
  accent: string;
  /** Text/icon color on primary fills. */
  onPrimary: string;
  destructive: string;
  destructiveDark: string;
  success: string;
  successLight: string;
  warning: string;
  warningBg: string;
  slate50: string;
  slate100: string;
  slate200: string;
  slate300: string;
  slate400: string;
  slate500: string;
  slate600: string;
  slate700: string;
  slate800: string;
  slate900: string;
  shadow: string;
};

export type AppThemeId = 'default' | 'ducky' | 'night';

export const defaultColors: ColorPalette = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  foreground: '#0F172A',
  muted: '#94A3B8',
  mutedForeground: '#64748B',
  border: '#F1F5F9',
  borderStrong: '#E2E8F0',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryMuted: '#DBEAFE',
  accent: '#3B82F6',
  onPrimary: '#FFFFFF',
  destructive: '#EF4444',
  destructiveDark: '#DC2626',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#B45309',
  warningBg: '#FFFBEB',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  shadow: 'rgba(59, 130, 246, 0.25)',
};

/** Warm yellow brand with orange accent for interactive chrome. */
export const duckyColors: ColorPalette = {
  background: '#FAFAF7',
  surface: '#FFFFFF',
  foreground: '#2F2A1F',
  muted: '#B5A992',
  mutedForeground: '#6B6456',
  border: '#F0EDE4',
  borderStrong: '#E5E0D4',
  primary: '#F8DD58',
  primaryDark: '#E8CB3A',
  primaryLight: '#FEF9E7',
  primaryMuted: '#FBF0C4',
  accent: '#F05A28',
  onPrimary: '#2F2A1F',
  destructive: '#EF4444',
  destructiveDark: '#DC2626',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#B45309',
  warningBg: '#FFFBEB',
  slate50: '#FAFAF7',
  slate100: '#F0EDE4',
  slate200: '#E5E0D4',
  slate300: '#D1C9B8',
  slate400: '#B5A992',
  slate500: '#6B6456',
  slate600: '#544E42',
  slate700: '#3F3A30',
  slate800: '#2F2A1F',
  slate900: '#2F2A1F',
  shadow: 'rgba(240, 90, 40, 0.25)',
};

/** Dark navy surfaces with cool blue accent for night use. */
export const nightColors: ColorPalette = {
  background: '#0B1220',
  surface: '#151D2E',
  foreground: '#E8EEF7',
  muted: '#64748B',
  mutedForeground: '#94A3B8',
  border: '#1E293B',
  borderStrong: '#334155',
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  primaryLight: '#1E3A5F',
  primaryMuted: '#1E293B',
  accent: '#60A5FA',
  onPrimary: '#0B1220',
  destructive: '#F87171',
  destructiveDark: '#EF4444',
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningBg: '#422006',
  slate50: '#151D2E',
  slate100: '#1E293B',
  slate200: '#334155',
  slate300: '#475569',
  slate400: '#64748B',
  slate500: '#94A3B8',
  slate600: '#CBD5E1',
  slate700: '#E2E8F0',
  slate800: '#F1F5F9',
  slate900: '#F8FAFC',
  shadow: 'rgba(96, 165, 250, 0.25)',
};

export const themes: Record<AppThemeId, ColorPalette> = {
  default: defaultColors,
  ducky: duckyColors,
  night: nightColors,
};

/** @deprecated Prefer useTheme().colors — kept for non-React modules / boot fallback. */
export const colors = defaultColors;
