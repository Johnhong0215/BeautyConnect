import { useEffect } from 'react';
import { router } from 'expo-router';

export default function BookingIndex() {
  useEffect(() => {
    // Redirect to reservation type selection
    router.replace('/booking/reservation-type');
  }, []);

  return null;
} 