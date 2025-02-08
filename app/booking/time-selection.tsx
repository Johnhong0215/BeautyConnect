import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getAvailableTimeSlots } from '../../src/utils/availability';
import { format, parseISO } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

export default function TimeSelection() {
  const params = useLocalSearchParams<{
    serviceId: string;
    duration: string;
    price: string;
    date: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (params.date) {
      fetchTimeSlots();
    }
  }, [params.date]);

  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const durationNum = Number(params.duration);
      
      if (isNaN(durationNum)) {
        setTimeSlots([]);
        return;
      }

      const slots = await getAvailableTimeSlots(
        params.date,
        durationNum
      );

      setTimeSlots(slots.filter(slot => slot.isAvailable));
    } catch (error) {
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    if (!selectedTime) return;

    router.push({
      pathname: '/booking/confirmation',
      params: {
        ...params,
        time: selectedTime,
      },
    });
  };

  const renderTimeSlots = () => {
    // Group available slots by time of day
    const morningSlots = timeSlots.filter(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      return hour < 12;
    });

    const afternoonSlots = timeSlots.filter(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      return hour >= 12 && hour < 17;
    });

    const eveningSlots = timeSlots.filter(slot => {
      const hour = parseInt(slot.start_time.split(':')[0]);
      return hour >= 17;
    });

    return (
      <>
        {morningSlots.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Morning</Text>
            <View style={styles.timeGrid}>
              {morningSlots.map((slot) => (
                <Chip
                  key={slot.start_time}
                  selected={selectedTime === slot.start_time}
                  onPress={() => handleTimeSelect(slot.start_time)}
                  style={styles.timeChip}
                  mode={selectedTime === slot.start_time ? 'flat' : 'outlined'}
                >
                  {format(parseISO(`2000-01-01T${slot.start_time}`), 'h:mm a')}
                </Chip>
              ))}
            </View>
          </>
        )}

        {afternoonSlots.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Afternoon</Text>
            <View style={styles.timeGrid}>
              {afternoonSlots.map((slot) => (
                <Chip
                  key={slot.start_time}
                  selected={selectedTime === slot.start_time}
                  onPress={() => handleTimeSelect(slot.start_time)}
                  style={styles.timeChip}
                  mode={selectedTime === slot.start_time ? 'flat' : 'outlined'}
                >
                  {format(parseISO(`2000-01-01T${slot.start_time}`), 'h:mm a')}
                </Chip>
              ))}
            </View>
          </>
        )}

        {eveningSlots.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Evening</Text>
            <View style={styles.timeGrid}>
              {eveningSlots.map((slot) => (
                <Chip
                  key={slot.start_time}
                  selected={selectedTime === slot.start_time}
                  onPress={() => handleTimeSelect(slot.start_time)}
                  style={styles.timeChip}
                  mode={selectedTime === slot.start_time ? 'flat' : 'outlined'}
                >
                  {format(parseISO(`2000-01-01T${slot.start_time}`), 'h:mm a')}
                </Chip>
              ))}
            </View>
          </>
        )}

        {timeSlots.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No available time slots for this date
            </Text>
          </View>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text variant="headlineMedium" style={styles.title}>
        Select Time
      </Text>

      <ScrollView style={styles.scrollView}>
        {renderTimeSlots()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          disabled={!selectedTime}
          style={styles.button}
        >
          Confirm Time
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: SPACING.xl,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  timeChip: {
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
  },
  buttonContainer: {
    padding: SPACING.lg,
  },
  button: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    fontSize: 18,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
}); 