import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/services/supabase';
import { COLORS, SPACING } from '../../../src/constants/theme';

interface Salon {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function DesignerHome() {
  const { session } = useAuth();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('hair_salon')
        .select('*')
        .eq('owner_id', session.user.id);

      if (error) throw error;
      setSalons(data || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Designer Mode</Text>
        <Chip mode="flat" style={styles.modeChip}>Designer</Chip>
      </Surface>

      <ScrollView style={styles.content}>
        {salons.map(salon => (
          <Card key={salon.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge">{salon.name}</Text>
              <Text variant="bodyMedium">{salon.address}</Text>
              <Text variant="bodyMedium">{salon.phone}</Text>
              <Text variant="bodyMedium">{salon.email}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => router.push(`/salon/edit/${salon.id}`)}>
                Edit Salon
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  modeChip: {
    backgroundColor: COLORS.primary,
  },
}); 