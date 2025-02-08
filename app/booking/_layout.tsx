import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';

export default function BookingLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerSafeAreaInsets: { top: insets.top },
        headerLeft: () => (
          <IconButton
            icon="arrow-left"
            onPress={() => router.back()}
          />
        ),
      }}
      initialRouteName="index"
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Book Appointment',
        }}
      />
      <Stack.Screen
        name="reservation-type"
        options={{
          title: 'Reservation Type',
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
          title: 'Select Date',
        }}
      />
      <Stack.Screen
        name="time-selection"
        options={{
          title: 'Select Time',
        }}
      />
      <Stack.Screen
        name="guest-list"
        options={{
          title: 'Select Guest',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="guest-profile"
        options={{
          title: 'Select Guest',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="guest-form"
        options={{
          title: 'Guest Information',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen
        name="confirmation"
        options={{
          title: 'Confirm Booking',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Booking Confirmed',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
} 