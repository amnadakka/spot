import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

type ToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

export default function Toggle({ enabled, onToggle }: ToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      style={[styles.track, enabled ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.thumb, enabled ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOn: {
    backgroundColor: colors.primary,
  },
  trackOff: {
    backgroundColor: colors.slate200,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});
