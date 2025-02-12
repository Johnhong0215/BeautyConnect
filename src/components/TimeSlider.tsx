import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { COLORS, SPACING } from '../constants/theme';

interface TimeSliderProps {
    value: string;
    onChange: (time: string) => void;
    label: string;
    disabled?: boolean;
  }

export default function TimeSlider({ value, onChange, label, disabled }: TimeSliderProps) {
  // Convert HH:mm to minutes since midnight
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes since midnight to HH:mm
  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const minutes = timeToMinutes(value);

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, disabled && styles.textDisabled]}>{label}</Text>
        <Text style={[styles.time, disabled && styles.textDisabled]}>
          {format(new Date(`2000-01-01T${value}`), 'h:mm a')}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1440}
        step={15}
        value={minutes}
        disabled={disabled}
        onValueChange={(mins) => !disabled && onChange(minutesToTime(mins))}
        minimumTrackTintColor={disabled ? '#E0E0E0' : COLORS.primary}
        maximumTrackTintColor={disabled ? '#EEEEEE' : COLORS.border}
        thumbTintColor={disabled ? '#BDBDBD' : COLORS.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  time: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  slider: {
    height: 40,
  },
  containerDisabled: {
    opacity: 0.7,
  },
  textDisabled: {
    color: '#9E9E9E',
  },
});