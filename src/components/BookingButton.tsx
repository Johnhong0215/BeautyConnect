import { Button } from 'react-native-paper';
import { router } from 'expo-router';

export function BookingButton() {
  return (
    <Button 
      mode="contained" 
      onPress={() => router.push('/booking/reservation-type')}
    >
      Make Reservation
    </Button>
  );
} 