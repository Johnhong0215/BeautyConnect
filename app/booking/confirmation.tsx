import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { format, addMinutes, parseISO } from 'date-fns';
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
  const { guestId } = useBooking();
  const params = useLocalSearchParams<{
    serviceId: string;
    duration: string;
    price: string;
    date: string;
    time: string;
    guestId?: string;
  }>();

  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [serviceName, setServiceName] = useState<string>('');

  const startDateTime = parseISO(`${params.date}T${params.time}`);
  const endDateTime = addMinutes(startDateTime, parseInt(params.duration));

  useEffect(() => {
    fetchServiceAndGuestInfo();
  }, []);

  const fetchServiceAndGuestInfo = async () => {
    if (!session?.user) return;
    
    try {
      // Fetch service name
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', params.serviceId)
        .single();

      if (service) {
        setServiceName(service.name);
      }

      // If guestId exists, fetch guest info
      if (params.guestId) {
        const { data: guest } = await supabase
          .from('guests')
          .select('full_name, gender')
          .eq('id', params.guestId)
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

  const handleConfirm = async () => {
    try {
      const appointmentDate = format(startDateTime, 'yyyy-MM-dd');
      const startTime = format(startDateTime, 'HH:mm:ss');
      const endTime = format(endDateTime, 'HH:mm:ss');

      // Double check availability - only check for exact time overlap
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', appointmentDate)
        .or(`start_time.eq.${startTime},and(start_time.gt.${startTime},start_time.lt.${endTime})`)
        .in('status', ['confirmed', 'pending']);

      if (existingAppointments && existingAppointments.length > 0) {
        Alert.alert(
          'Time Slot Not Available',
          'This time slot has just been booked. Please select a different time.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      const appointmentData = {
        service_id: params.serviceId,
        user_id: session?.user.id,
        guest_id: params.guestId || null,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        duration: parseInt(params.duration),
        total_price: parseFloat(params.price),
        status: 'confirmed'
      };

      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Navigate to success screen with appointment details
      router.push({
        pathname: '/booking/success',
        params: {
          appointmentId: data.id,
          serviceId: params.serviceId,
          serviceName,
          duration: params.duration,
          price: params.price,
          date: params.date,
          time: params.time,
          guestName: guestInfo?.full_name,
        }
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      Alert.alert('Error', 'Failed to confirm appointment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text variant="headlineMedium" style={styles.title}>
        Confirm Appointment
      </Text>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Service Details
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              Service: {serviceName}
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              For: {guestInfo ? guestInfo.full_name : 'Myself'}
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              Date: {format(startDateTime, 'MMMM d, yyyy')}
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              Time: {format(startDateTime, 'h:mm a')} - {format(endDateTime, 'h:mm a')}
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              Duration: {params.duration} minutes
            </Text>
            <Text variant="bodyLarge" style={styles.detail}>
              Price: ${parseFloat(params.price).toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleConfirm}
          style={styles.button}
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
    backgroundColor: COLORS.surface,
  },
  title: {
    textAlign: 'center',
    marginVertical: SPACING.xl,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  detail: {
    marginBottom: 12,
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