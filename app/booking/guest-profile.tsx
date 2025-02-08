import { useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';

export default function GuestProfile() {
  const { session } = useAuth();
  const { setGuestId } = useBooking();
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');

  const handleContinue = async () => {
    if (bookingFor === 'self') {
      setGuestId(null);
      // Go directly to service selection for self
      router.push({
        pathname: '/booking/service-selection',
        params: { 
          serviceType: 'hair',
          guestId: null
        }
      });
    } else {
      // Go to guest list
      router.push('/booking/guest-list');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Text variant="headlineSmall" style={styles.title}>
          Who is this service for?
        </Text>

        <View style={styles.content}>
          <SegmentedButtons
            value={bookingFor}
            onValueChange={value => setBookingFor(value as 'self' | 'other')}
            buttons={[
              { value: 'self', label: 'For Myself' },
              { value: 'other', label: 'For Someone Else' },
            ]}
            style={styles.segmented}
          />

          <Button
            mode="contained"
            onPress={handleContinue}
            style={styles.button}
          >
            Continue
          </Button>
        </View>
      </ScrollView>
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
  segmented: {
    marginBottom: SPACING.xl,
  },
  button: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
}); 