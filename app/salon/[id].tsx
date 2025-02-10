import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING } from '@/constants/theme';
import { DESIGNER_COLORS } from '../designer/tabs/index';

export default function SalonForm() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const isEditing = params.id !== 'add';
  
  const [loading, setLoading] = useState(false);
  const [salon, setSalon] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    business_hours: Array(7).fill({
      day_of_week: 0,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false
    })
  });

  useEffect(() => {
    if (isEditing) {
      fetchSalonDetails();
    }
  }, [params.id]);

  const fetchSalonDetails = async () => {
    try {
      const { data: salonData, error: salonError } = await supabase
        .from('hair_salon')
        .select('*')
        .eq('id', params.id)
        .single();

      if (salonError) throw salonError;

      const { data: hoursData, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('salon_id', params.id)
        .order('day_of_week');

      if (hoursError) throw hoursError;

      setSalon({
        ...salonData,
        business_hours: hoursData || salon.business_hours
      });
    } catch (error) {
      console.error('Error fetching salon details:', error);
      Alert.alert('Error', 'Failed to load salon details');
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      if (isEditing) {
        // Update existing salon
        const { error: salonError } = await supabase
          .from('hair_salon')
          .update({
            name: salon.name,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
          })
          .eq('id', params.id);

        if (salonError) throw salonError;

        // Update business hours
        for (const hours of salon.business_hours) {
          const { error: hoursError } = await supabase
            .from('business_hours')
            .upsert({
              salon_id: params.id,
              ...hours
            });

          if (hoursError) throw hoursError;
        }
      } else {
        // Create new salon
        const { data: newSalon, error: salonError } = await supabase
          .from('hair_salon')
          .insert({
            name: salon.name,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
            owner_id: session.user.id
          })
          .select()
          .single();

        if (salonError) throw salonError;

        // Create business hours
        const hoursData = salon.business_hours.map(hours => ({
          ...hours,
          salon_id: newSalon.id
        }));

        const { error: hoursError } = await supabase
          .from('business_hours')
          .insert(hoursData);

        if (hoursError) throw hoursError;
      }

      router.back();
    } catch (error) {
      console.error('Error saving salon:', error);
      Alert.alert('Error', 'Failed to save salon details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>
          {isEditing ? 'Edit Business' : 'Add New Business'}
        </Text>
      </Surface>

      <ScrollView style={styles.content}>
        <TextInput
          label="Business Name"
          value={salon.name}
          onChangeText={name => setSalon(s => ({ ...s, name }))}
          style={styles.input}
        />

        <TextInput
          label="Address"
          value={salon.address}
          onChangeText={address => setSalon(s => ({ ...s, address }))}
          style={styles.input}
        />

        <TextInput
          label="Phone"
          value={salon.phone}
          onChangeText={phone => setSalon(s => ({ ...s, phone }))}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={salon.email}
          onChangeText={email => setSalon(s => ({ ...s, email }))}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
          disabled={!salon.name || !salon.address}
        >
          {isEditing ? 'Save Changes' : 'Add Business'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGNER_COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: DESIGNER_COLORS.primary,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  input: {
    marginBottom: SPACING.md,
    backgroundColor: DESIGNER_COLORS.surface,
  },
  button: {
    marginTop: SPACING.xl,
    backgroundColor: DESIGNER_COLORS.primary,
  },
}); 