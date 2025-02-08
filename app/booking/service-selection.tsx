import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { ProfileForm } from '../../src/components/ProfileForm';
import { Profile, Service } from '../../src/types/database';
import { createInitialProfile } from '../../src/utils/auth';

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
  const params = useLocalSearchParams<{ serviceType: 'hair' | 'nail', guestId?: string }>();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    fetchProfileAndServices();
  }, [params.serviceType, params.guestId]);

  const fetchProfileAndServices = async () => {
    try {
      setLoading(true);
      
      // Fetch gender information based on whether it's for a guest or self
      if (params.guestId) {
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .select('gender')
          .eq('id', params.guestId)
          .single();

        if (guestError) throw guestError;
        setGender(guestData?.gender || null);
      } else if (session?.user) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('gender')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        setGender(userData?.gender || null);
      }

      // Fetch services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('type', params.serviceType)
        .order('created_at');

      if (servicesError) throw servicesError;
      setServices(services || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (service: Service) => {
    if (!gender) return service.duration_male;
    return gender === 'female' ? service.duration_female : service.duration_male;
  };

  const calculatePrice = (service: Service) => {
    if (!gender) return service.price_male;
    return gender === 'female' ? service.price_female : service.price_male;
  };

  const handleServiceSelect = (service: Service) => {
    const duration = calculateDuration(service);
    const price = calculatePrice(service);

    router.push({
      pathname: '/booking/date-selection',
      params: { 
        serviceId: service.id,
        duration: duration.toString(),
        price: price.toString(),
        guestId: params.guestId
      }
    });
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