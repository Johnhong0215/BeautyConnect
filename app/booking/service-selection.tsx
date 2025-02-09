import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { ProfileForm } from '../../src/components/ProfileForm';
import { Profile, Service, Gender } from '../../src/types/database';
import { createInitialProfile } from '../../src/utils/auth';
import { useBooking } from '../../src/contexts/BookingContext';
import { Alert } from 'react-native';

interface GuestProfile {
  id: string;
  created_by: string;
  full_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  hair_length?: 'short' | 'medium' | 'long';
  hair_color?: string;
  notes?: string;
}

export default function ServiceSelection() {
  const { session } = useAuth();
  const { selectedSalon, getAvailableServices, handleServiceSelect } = useBooking();
  const params = useLocalSearchParams<{ serviceType: 'hair' | 'nail', guestId?: string }>();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchUserGenderAndServices = async () => {
    try {
      setLoading(true);
      
      // Fetch gender based on whether it's for a guest or the user themselves
      if (params.guestId) {
        const { data: guestData } = await supabase
          .from('guests')
          .select('gender')
          .eq('id', params.guestId)
          .single();
        setGender(guestData?.gender || 'male');
      } else if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', session.user.id)
          .single();
        setGender(profileData?.gender || 'male');
      }

      // Fetch services using salon ID and service type
      if (!selectedSalon?.id) {
        throw new Error('No salon selected');
      }
      const availableServices = await getAvailableServices(selectedSalon.id, params.serviceType);
      setServices(availableServices);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSalon) {
      router.replace('/booking/select-salon');
      return;
    }
    fetchUserGenderAndServices();
  }, [selectedSalon]);

  const calculateDuration = (service: Service) => {
    return gender === 'female' ? service.duration_female : service.duration_male;
  };

  const calculatePrice = (service: Service) => {
    return gender === 'female' ? service.price_female : service.price_male;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>
          Select a Service
        </Text>
        
        {services.map((service) => (
          <Card key={service.id} style={styles.card}>
            <Card.Title title={service.name} />
            <Card.Content>
              <Text variant="bodyMedium">{service.description}</Text>
              <Text variant="bodyMedium" style={styles.details}>
                Duration: {calculateDuration(service)} minutes 
              </Text>
              <Text variant="bodyMedium" style={styles.details}>
                Price: ${calculatePrice(service).toFixed(2)}
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained"
                onPress={() => handleServiceSelect(service)}
              >
                Select
              </Button>
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
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  details: {
    marginTop: 8,
    color: '#666',
  },
}); 