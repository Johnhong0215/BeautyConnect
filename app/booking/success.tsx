import { StyleSheet, View } from 'react-native';
import { Text, Button, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format, parseISO, addMinutes } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookingSuccess() {
  const params = useLocalSearchParams<{
    serviceId: string;
    serviceName: string;
    duration: string;
    price: string;
    date: string;
    time: string;
    guestName?: string;
  }>();

  const startDateTime = parseISO(`${params.date}T${params.time}`);
  const endDateTime = addMinutes(startDateTime, parseInt(params.duration));

  const handleGoHome = () => {
    router.replace('/tabs');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.successIcon}>
        <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
      </View>

      <Text variant="headlineMedium" style={styles.title}>
        Booking Confirmed!
      </Text>

      <Text variant="bodyLarge" style={styles.subtitle}>
        Your appointment has been successfully booked
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge">{params.serviceName}</Text>
            <Chip
              mode="flat"
              textStyle={{ color: 'white' }}
              style={[styles.statusChip, { backgroundColor: '#4CAF50' }]}
            >
              Confirmed
            </Chip>
          </View>

          <Text variant="bodyLarge" style={styles.detail}>
            For: {params.guestName || 'Myself'}
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

      <Button
        mode="contained"
        onPress={handleGoHome}
        style={styles.button}
      >
        Back to Home
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  successIcon: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    borderRadius: 12,
  },
  detail: {
    marginTop: 8,
    color: '#333',
  },
  buttonContainer: {
    padding: 20,
    marginTop: 'auto',
  },
  button: {
    marginTop: 10,
  },
}); 