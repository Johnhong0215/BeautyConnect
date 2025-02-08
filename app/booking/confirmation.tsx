import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { format } from 'date-fns';
import { Database } from '../../src/types/supabase';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useState, useEffect } from 'react';

interface GuestInfo {
  full_name: string;
  gender: string;
}

export default function Confirmation() {
  const { session } = useAuth();
  const { guestId, selectedSalon, selectedService, selectedTimeSlot, setSelectedTimeSlot } = useBooking();
  const params = useLocalSearchParams<{ date: string }>();

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [serviceName, setServiceName] = useState<string>('');

  useEffect(() => {
    fetchServiceAndGuestInfo();
    if (!selectedSalon || !selectedService || !selectedTimeSlot) {
      router.replace('/booking/select-salon');
    }
  }, [selectedSalon, selectedService, selectedTimeSlot]);

  const fetchServiceAndGuestInfo = async () => {
    if (!session?.user) return;
    
    try {
      // Fetch service name
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', selectedService.id)
        .single();

      if (service) {
        setServiceName(service.name);
      }

      // If guestId exists, fetch guest info
      if (guestId) {
        const { data: guest } = await supabase
          .from('guests')
          .select('full_name, gender')
          .eq('id', guestId)
          .single();

        if (guest) {
          setGuestInfo(guest);
        }
      } else {
        // If no guestId, fetch user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setGuestInfo({
            full_name: profile.full_name,
            gender: 'self'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      // Create a valid date object using the selected date and time
      const [hours, minutes] = timeStr.split(':');
      const date = new Date(params.date);
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeStr;
    }
  };

  const handleConfirm = async () => {
    try {
      if (!selectedSalon || !selectedService || !selectedTimeSlot || !session?.user) {
        throw new Error('Missing booking information');
      }

      const appointmentData = {
        salon_id: selectedSalon.id,
        service_id: selectedService.id,
        user_id: session.user.id,
        appointment_date: params.date,
        start_time: selectedTimeSlot.start_time,
        end_time: selectedTimeSlot.end_time,
        duration: selectedService.duration_male,
        total_price: selectedService.price_male,
        status: 'confirmed'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;

      router.push({
        pathname: '/booking/success',
        params: { appointmentId: data.id }
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Confirm Booking</Text>
      </Surface>

      <View style={styles.content}>
        <Text variant="titleMedium">Salon</Text>
        <Text style={styles.detail}>{selectedSalon?.name}</Text>

        <Text variant="titleMedium" style={styles.section}>Service</Text>
        <Text style={styles.detail}>{selectedService?.name}</Text>

        <Text variant="titleMedium" style={styles.section}>Date</Text>
        <Text style={styles.detail}>
          {params.date && format(new Date(params.date), 'MMMM d, yyyy')}
        </Text>

        <Text variant="titleMedium" style={styles.section}>Time</Text>
        <Text style={styles.detail}>
          {selectedTimeSlot && formatTime(selectedTimeSlot.start_time)}
        </Text>

        <Button 
          mode="contained" 
          style={styles.button}
          onPress={handleConfirm}
        >
          Confirm Booking
        </Button>
      </View>
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
  content: {
    padding: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
  },
  detail: {
    marginTop: SPACING.sm,
    fontSize: 16,
  },
  button: {
    marginTop: SPACING.xl * 2,
  },
  card: {
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
}); 