import { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../src/services/supabase';
import { format, addMonths, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

interface MarkedDates {
  [date: string]: {
    disabled?: boolean;
    disableTouchEvent?: boolean;
    selected?: boolean;
    selectedColor?: string;
  };
}

export default function DateSelection() {
  const params = useLocalSearchParams<{
    serviceId: string;
    duration: string;
    price: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  useEffect(() => {
    fetchUnavailableDates();
  }, []);

  const fetchUnavailableDates = async () => {
    try {
      // Get all appointments for the next 3 months
      const startDate = new Date();
      const endDate = addMonths(startDate, 3);
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_date, duration')
        .gte('appointment_date', startDate.toISOString())
        .lte('appointment_date', endDate.toISOString())
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      // Get business hours
      const { data: businessHours, error: hoursError } = await supabase
        .from('business_hours')
        .select('*');

      if (hoursError) throw hoursError;

      // Process dates and create marked dates object
      const marked: MarkedDates = {};
      const today = startOfDay(new Date());

      // Mark past dates as disabled
      let currentDate = startOfDay(new Date());
      while (isBefore(currentDate, endDate)) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = currentDate.getDay();
        const businessDay = businessHours?.find(h => h.day_of_week === dayOfWeek);

        marked[dateStr] = {
          disabled: isBefore(currentDate, today) || businessDay?.is_closed,
          disableTouchEvent: isBefore(currentDate, today) || businessDay?.is_closed,
        };

        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: { dateString: string }) => {
    const dateString = date.dateString;
    
    // Clear previous selection and set new one
    const newMarkedDates = { ...markedDates };
    
    // Remove 'selected' from all dates
    Object.keys(newMarkedDates).forEach(key => {
      if (newMarkedDates[key].selected) {
        delete newMarkedDates[key].selected;
      }
    });

    // Add new selection
    newMarkedDates[dateString] = {
      ...newMarkedDates[dateString],
      selected: true,
      selectedColor: '#6200ee',
    };

    setSelectedDate(dateString);
    setMarkedDates(newMarkedDates);
  };

  const handleNext = () => {
    if (!selectedDate) return;

    const duration = parseInt(params.duration);
    if (isNaN(duration)) {
      console.error('Invalid duration:', params.duration);
      return;
    }

    router.push({
      pathname: '/booking/time-selection',
      params: {
        ...params,
        date: selectedDate, // This is already in YYYY-MM-DD format
        duration: duration.toString()
      },
    });
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
        Select check-in date
      </Text>
      
      <Text variant="bodyMedium" style={styles.subtitle}>
        Prices on calendar do not include taxes and fees
      </Text>

      <Calendar
        current={format(new Date(), 'yyyy-MM-dd')}
        minDate={format(new Date(), 'yyyy-MM-dd')}
        maxDate={format(addMonths(new Date(), 2), 'yyyy-MM-dd')}
        onDayPress={handleDateSelect}
        markedDates={markedDates}
        theme={calendarTheme}
      />

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!selectedDate}
          style={styles.button}
        >
          Save
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
  subtitle: {
    color: '#666',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    padding: 20,
    marginTop: 'auto',
  },
  button: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  calendar: {
    borderRadius: 16,
    margin: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

const calendarTheme = {
  backgroundColor: COLORS.surface,
  calendarBackground: COLORS.surface,
  textSectionTitleColor: COLORS.textSecondary,
  selectedDayBackgroundColor: COLORS.primary,
  selectedDayTextColor: COLORS.surface,
  todayTextColor: COLORS.primary,
  dayTextColor: COLORS.text,
  textDisabledColor: COLORS.disabled,
  dotColor: COLORS.primary,
  monthTextColor: COLORS.text,
  textDayFontSize: 16,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 14,
}; 