import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Surface, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBooking } from '@/contexts/BookingContext';
import { COLORS, SPACING } from '@/constants/theme';
import { supabase } from '@/services/supabase';
import { Gender } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

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

interface Guest {
  id: string;
  full_name: string;
  age: number;
  gender: Gender;
  hair_length: string;
  created_at: string;
}

export default function ServiceSelection() {
  const { selectedSalon, handleServiceSelect, guestId } = useBooking();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  useEffect(() => {
    loadSalonServices();
    fetchGender();
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

  const fetchGender = async () => {
    try {
      if (guestId) {
        const { data: guest } = await supabase
          .from('guests')
          .select('gender')
          .eq('id', guestId)
          .single();
        if (guest?.gender) setGender(guest.gender);
      } else if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', session.user.id)
          .single();
        if (profile?.gender) setGender(profile.gender);
      }
    } catch (error) {
      console.error('Error fetching gender:', error);
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
          >
            <Card.Content>
              <Text variant="titleLarge">{service.name}</Text>
              {service.description && (
                <Text variant="bodyMedium">{service.description}</Text>
              )}
              <View style={styles.serviceDetails}>
                <Text variant="bodyLarge">
                  Duration: {gender === 'male' ? service.duration_male : service.duration_female} mins
                </Text>
                <Text variant="bodyLarge">
                  Price: ${gender === 'male' ? service.price_male : service.price_female}
                </Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {
                handleServiceSelect(service);
              }}>Select</Button>
            </Card.Actions>
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