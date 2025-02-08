import { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING } from '../../src/constants/theme';
import { format } from 'date-fns';
import { supabase } from '../../src/services/supabase';
import { Alert } from 'react-native';

interface AvailableDate {
  available_date: string;
  has_slots: boolean;
}

export default function DateSelection() {
  const { selectedSalon, selectedService } = useBooking();
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSalon || !selectedService) {
      router.replace('/booking/service-selection');
      return;
    }
    fetchAvailableDates();
  }, [selectedSalon, selectedService]);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_available_dates', {
        p_salon_id: selectedSalon!.id,
        p_service_id: selectedService!.id,
        p_start_date: format(new Date(), 'yyyy-MM-dd'),
        p_days_ahead: 30
      });

      if (error) throw error;
      setAvailableDates(data || []);
    } catch (error) {
      console.error('Error fetching available dates:', error);
      Alert.alert('Error', 'Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  const markedDates = availableDates.reduce((acc, date) => {
    if (date.has_slots) {
      acc[date.available_date] = {
        marked: true,
        dotColor: COLORS.primary,
        selected: date.available_date === selectedDate,
        selectedColor: COLORS.primary
      };
    }
    return acc;
  }, {} as any);

  const handleDateSelect = (date: string) => {
    const selectedDateData = availableDates.find(d => d.available_date === date);
    if (selectedDateData?.has_slots) {
      setSelectedDate(date);
      router.push({
        pathname: '/booking/time-selection',
        params: { date }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Select Date</Text>
      </Surface>

      <Calendar
        markedDates={markedDates}
        onDayPress={day => handleDateSelect(day.dateString)}
        minDate={format(new Date(), 'yyyy-MM-dd')}
        maxDate={format(new Date().setDate(new Date().getDate() + 30), 'yyyy-MM-dd')}
        theme={{
          selectedDayBackgroundColor: COLORS.primary,
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
        }}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 