import { StyleSheet, View } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useBooking } from '../../src/contexts/BookingContext';
import { useEffect } from 'react';

export default function Success() {
  const { selectedSalon, selectedService, selectedTimeSlot, resetBooking } = useBooking();
  const params = useLocalSearchParams<{ appointmentId: string }>();

  useEffect(() => {
    if (!selectedSalon || !selectedService || !selectedTimeSlot) {
      router.replace('/booking/select-salon');
    }
  }, [selectedSalon, selectedService, selectedTimeSlot]);

  const handleDone = () => {
    resetBooking(); // Reset the booking state
    router.replace('/'); // Go back to home
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Booking Confirmed!</Text>
      </Surface>

      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.message}>
          Your appointment has been successfully booked.
        </Text>
        
        {selectedSalon && (
          <Text variant="bodyMedium" style={styles.detail}>
            Salon: {selectedSalon.name}
          </Text>
        )}
        
        {selectedService && (
          <Text variant="bodyMedium" style={styles.detail}>
            Service: {selectedService.name}
          </Text>
        )}
        
        <Text variant="bodyMedium" style={styles.detail}>
          Booking reference: {params.appointmentId}
        </Text>

        <Button 
          mode="contained" 
          style={styles.button}
          onPress={handleDone}
        >
          Done
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
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  detail: {
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING.xl * 2,
    width: '100%',
  },
}); 