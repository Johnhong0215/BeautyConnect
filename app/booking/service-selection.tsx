import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBooking } from '@/contexts/BookingContext';
import { COLORS, SPACING } from '@/constants/theme';
import { supabase } from '@/services/supabase';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_male: number;
  duration_female: number;
  price_male: number;
  price_female: number;
  created_at: string;
  salon_id: string;
}

export default function ServiceSelection() {
  const { selectedSalon, handleServiceSelect } = useBooking();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    loadSalonServices();
  }, [selectedSalon]);

  const loadSalonServices = async () => {
    if (!selectedSalon?.id) {
      router.back();
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', selectedSalon.id);

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Select Service</Text>
      </Surface>

      <View style={styles.salonInfo}>
        <Text variant="titleLarge">{selectedSalon?.name}</Text>
        <Text variant="bodyMedium">{selectedSalon?.address}</Text>
      </View>

      <ScrollView style={styles.serviceList}>
        {services.map(service => (
          <Card
            key={service.id}
            style={styles.card}
            onPress={() => {
              handleServiceSelect(service);
              const today = new Date().toISOString().split('T')[0];
              router.push({
                pathname: '/booking/time-selection',
                params: { date: today }
              });
            }}
          >
            <Card.Content>
              <Text variant="titleMedium">{service.name}</Text>
              {service.description && (
                <Text variant="bodyMedium">{service.description}</Text>
              )}
              <View style={styles.serviceDetails}>
                <Text variant="bodyLarge">
                  ${service.price_male}
                </Text>
                <Text variant="bodyMedium">
                  {service.duration_male} mins
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
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
  salonInfo: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  serviceList: {
    flex: 1,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 