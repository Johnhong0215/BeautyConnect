import { StyleSheet, View, Alert, ScrollView } from 'react-native';
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

type Appointment = Database['public']['Tables']['appointments']['Row'];

export default function Confirmation() {
  const { session } = useAuth();
  const { guestId, selectedSalon, selectedService, selectedTimeSlot, setSelectedTimeSlot, confirmBooking } = useBooking();
  const params = useLocalSearchParams<{ date: string }>();

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [userInfo, setUserInfo] = useState<GuestInfo | null>(null);
  const [serviceName, setServiceName] = useState<string>('');

  useEffect(() => {
    fetchRecipientInfo();
    if (!selectedSalon || !selectedService || !selectedTimeSlot) {
      router.replace('/booking/select-salon');
    }
  }, [selectedSalon, selectedService, selectedTimeSlot]);

  const fetchRecipientInfo = async () => {
    try {
      if (guestId) {
        // Fetch guest information
        const { data: guestData } = await supabase
          .from('guests')
          .select('full_name, gender')
          .eq('id', guestId)
          .single();
        setGuestInfo(guestData);
      } else {
        // Fetch user's own information
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, gender')
          .eq('id', session?.user?.id)
          .single();
        setUserInfo(userData);
      }
    } catch (error) {
      console.error('Error fetching recipient info:', error);
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
      if (!selectedTimeSlot) {
        setSelectedTimeSlot({
          ...selectedTimeSlot!,
          date: params.date
        });
      }

      console.log('Starting confirmation with:', {
        date: params.date,
        guestId,
        selectedTimeSlot
      });

      const appointment: { id: string } | null = await confirmBooking();
      
      if (appointment?.id) {
        router.replace({
          pathname: '/booking/success',
          params: { 
            appointmentId: appointment.id
          }
        });
      }
    } catch (error) {
      console.error('Error during confirmation:', error);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Confirm Booking</Text>
      </Surface>

      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Appointment For</Text>
            <Text variant="bodyLarge">
              {guestInfo?.full_name || userInfo?.full_name || 'Loading...'}
            </Text>
          </Card.Content>
        </Card>

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