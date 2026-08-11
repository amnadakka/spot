import { Pressable, View } from 'react-native';

import { makeStyles } from '../../theme/makeStyles';

type ToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
};

export default function Toggle({ enabled, onToggle, accessibilityLabel }: ToggleProps) {
  const styles = useStyles();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, enabled ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.thumb, enabled ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  trackOn: {
    backgroundColor: colors.accent,
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
}));
