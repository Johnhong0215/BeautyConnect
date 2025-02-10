import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { format } from 'date-fns';
import { COLORS, SPACING } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';

interface TimeSlot {
  start_time: string; // format "HH:mm"
  end_time: string;   // format "HH:mm"
  is_available: boolean;
  date: string;       // format "YYYY-MM-DD"
}

// Helper to convert a YYYY-MM-DD string into a local Date object (at local midnight)
const getLocalDateFromString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper to return a local date string ("YYYY-MM-DD") from a Date object
const getLocalDateString = (date: Date) => {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return format(localDate, 'yyyy-MM-dd');
};

export default function TimeSelection() {
  const { session } = useAuth();
  const {
    selectedSalon,
    selectedService,
    getAvailableTimeSlots,
    setSelectedTimeSlot,
    guestId,
  } = useBooking();
  const params = useLocalSearchParams<{ date: string }>();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string>('');

  // Fetch recipient name from guests or profiles table
  const fetchRecipientName = async () => {
    if (!session?.user) return;
    try {
      if (guestId) {
        const { data } = await supabase
          .from('guests')
          .select('full_name')
          .eq('id', guestId)
          .single();
        setRecipientName(data?.full_name || '');
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        setRecipientName(data?.full_name || '');
      }
    } catch (error) {
      console.error('Error fetching recipient name:', error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRecipientName();
    }
  }, [session, guestId]);

  // When salon/service is not selected, redirect back.
  useEffect(() => {
    if (!selectedSalon || !selectedService) {
      router.replace('/booking/select-salon');
      return;
    }
    fetchTimeSlots();
  }, [selectedSalon, selectedService]);

  // Fetch available time slots and, if the selected date is today,
  // mark the past time slots (with a 5-minute buffer) as unavailable.
  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      let slots = await getAvailableTimeSlots(params.date);

      const todayStr = getLocalDateString(new Date());
      if (params.date === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const buffer = 5; // minutes buffer
        slots = slots.map(slot => {
          const [hour, minute] = slot.start_time.split(':').map(Number);
          const slotMinutes = hour * 60 + minute;
          // If the slot's start time is earlier than current time + buffer, mark it as unavailable.
          if (slotMinutes < currentMinutes + buffer) {
            return { ...slot, is_available: false };
          }
          return slot;
        });
      }

      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (startTime: string, endTime: string) => {
    setSelectedTime(startTime);
    setSelectedTimeSlot({
      start_time: startTime,
      end_time: endTime,
      is_available: true,
      date: params.date,
    });
    
    router.push({
      pathname: '/booking/confirmation',
      params: { date: params.date },
    });
  };

  // Group time slots into Morning, Afternoon, and Evening for display.
  const groupTimeSlots = () => {
    const groups: { [key: string]: TimeSlot[] } = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };

    timeSlots.forEach(slot => {
      const hour = parseInt(slot.start_time.split(':')[0], 10);
      if (hour < 12) {
        groups['Morning'].push(slot);
      } else if (hour < 17) {
        groups['Afternoon'].push(slot);
      } else {
        groups['Evening'].push(slot);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const groupedSlots = groupTimeSlots();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Select Time</Text>
        <Text variant="titleMedium" style={styles.date}>
          {format(getLocalDateFromString(params.date), 'MMMM d, yyyy')}
        </Text>
      </Surface>

      <ScrollView style={styles.content}>
        {Object.entries(groupedSlots).map(([period, slots]) =>
          slots.length > 0 ? (
            <View key={period} style={styles.section}>
              <Text variant="titleMedium" style={styles.periodTitle}>
                {period}
              </Text>
              <View style={styles.timeGrid}>
                {slots.map(slot => (
                  <Chip
                    key={slot.start_time}
                    selected={selectedTime === slot.start_time}
                    onPress={() => handleTimeSelect(slot.start_time, slot.end_time)}
                    disabled={!slot.is_available}
                    style={[
                      styles.timeChip,
                      !slot.is_available && styles.unavailable,
                    ]}
                  >
                    {format(new Date(`2000-01-01T${slot.start_time}`), 'h:mm a')}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  date: {
    marginTop: SPACING.sm,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  periodTitle: {
    marginBottom: SPACING.md,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeChip: {
    marginBottom: SPACING.sm,
  },
  unavailable: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
