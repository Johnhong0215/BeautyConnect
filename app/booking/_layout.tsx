import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';

export default function BookingLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        contentStyle: { paddingTop: insets.top },
        headerLeft: () => (
          <IconButton
            icon="arrow-left"
            onPress={() => router.back()}
          />
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Book Appointment',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="select-salon"
        options={{
          title: 'Select Salon',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="service-selection"
        options={{
          title: 'Select Service',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="date-selection"
        options={{
          title: 'Select Date'
        }}
      />
      <Stack.Screen
        name="time-selection"
        options={{
          title: 'Select Time'
        }}
      />
      <Stack.Screen
        name="confirmation"
        options={{
          title: 'Confirm Booking'
        }}
      />
    </Stack>
  );
} 