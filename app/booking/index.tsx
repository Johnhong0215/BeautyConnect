import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Surface, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING } from '../../src/constants/theme';

export default function BookingStart() {
  const { startNewBooking } = useBooking();
  const [bookingType, setBookingType] = useState<'self' | 'guest'>('self');

  const handleContinue = () => {
    startNewBooking(bookingType === 'guest');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Book Appointment</Text>
      </Surface>

      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.question}>
          Who is this appointment for?
        </Text>

        <RadioButton.Group 
          onValueChange={value => setBookingType(value as 'self' | 'guest')} 
          value={bookingType}
        >
          <View style={styles.option}>
            <RadioButton value="self" />
            <Text>For myself</Text>
          </View>
          <View style={styles.option}>
            <RadioButton value="guest" />
            <Text>For a guest</Text>
          </View>
        </RadioButton.Group>

        <Button 
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
        >
          Continue
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
  },
  question: {
    marginBottom: SPACING.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  button: {
    marginTop: SPACING.xl,
  },
}); 