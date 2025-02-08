import { StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';

export default function ReservationType() {
  const { setGuestId } = useBooking();

  const handleSelection = (type: 'self' | 'other') => {
    if (type === 'self') {
      setGuestId(null); // Clear any previous guest selection
      router.push('/booking/service-selection');
    } else {
      router.push('/booking/guest-list');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text variant="headlineMedium" style={styles.title}>
        Who is this reservation for?
      </Text>
      
      <Button 
        mode="contained"
        onPress={() => handleSelection('self')}
        style={styles.button}
      >
        For Myself
      </Button>
      
      <Button 
        mode="outlined"
        onPress={() => handleSelection('other')}
        style={styles.button}
      >
        For Someone Else
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginVertical: 8,
  },
}); 