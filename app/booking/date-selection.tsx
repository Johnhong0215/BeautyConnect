import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SPACING } from '../../src/constants/theme';
import { format } from 'date-fns';
import { supabase } from '../../src/services/supabase';

interface AvailableDate {
  available_date: string;
  has_slots: boolean;
}

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

// Helper to return a local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date) => {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return format(localDate, 'yyyy-MM-dd');
};

export default function DateSelection() {
  const { session } = useAuth();
  const { selectedSalon, selectedService, guestId } = useBooking();
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string>('');

  useEffect(() => {
    if (!selectedSalon || !selectedService) {
      router.replace('/booking/service-selection');
      return;
    }
    fetchAvailableDates();
  }, [selectedSalon, selectedService]);

  useEffect(() => {
    fetchRecipientName();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_available_dates', {
        p_salon_id: selectedSalon!.id,
        p_service_id: selectedService!.id,
        p_start_date: getLocalDateString(new Date()),
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
      <Text variant="titleMedium" style={styles.header}>
        Select Date for {recipientName}
      </Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day: CalendarDay) => handleDateSelect(day.dateString)}
        minDate={getLocalDateString(new Date())}
        maxDate={getLocalDateString(new Date(new Date().setDate(new Date().getDate() + 30)))}
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
