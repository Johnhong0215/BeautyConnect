import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { Text, Button, List, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { isProfileComplete, getProfile } from '@/utils/profile';
import { Gender } from '@/types/database';

interface Guest {
  id: string;
  full_name: string;
  age: number;
  gender: Gender;
  hair_length: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function GuestList() {
  const { session } = useAuth();
  const { setGuestId, setSelectedSalon, setSelectedService, setSelectedTimeSlot, setIsForGuest } = useBooking();
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUserAndGuests();
  }, []);

  const fetchUserAndGuests = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);

      // Fetch guests
      const { data: guestData, error } = await supabase
        .from('guests')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(guestData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSelect = (guestId: string) => {
    console.log('Selected guest ID:', guestId);
    setGuestId(guestId);
    setIsForGuest(true);
    setSelectedSalon(null);
    setSelectedService(null);
    setSelectedTimeSlot(null);
    router.push('/booking/select-salon');
  };

  const handleBookForSelf = async () => {
    if (!session?.user) return;

    try {
      const profile = await getProfile(session.user.id);
      
      if (!isProfileComplete(profile)) {
        // Redirect to profile completion form
        router.push({
          pathname: '/profile/complete',
          params: { 
            returnTo: '/booking/select-salon'
          }
        });
        return;
      }

      // Existing reset and navigation logic
      setSelectedSalon(null);
      setSelectedService(null);
      setSelectedTimeSlot(null);
      setGuestId(null);
      router.push('/booking/select-salon');
    } catch (error) {
      console.error('Error checking profile:', error);
      Alert.alert('Error', 'Unable to proceed with booking');
    }
  };

  const handleAddGuest = () => {
    router.push('/booking/guest-form');
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Who is this service for?
        </Text>

        <View style={styles.mainContent}>
          <List.Item
            title={userProfile?.full_name || 'Myself'}
            description="Book for yourself"
            onPress={handleBookForSelf}
            left={props => <List.Icon {...props} icon="account" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            style={styles.listItem}
          />

          {guests.length > 0 && (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Your Guests
              </Text>
              
              <List.Section>
                {guests.map(guest => (
                  <List.Item
                    key={guest.id}
                    title={guest.full_name}
                    description={`${guest.age} years • ${guest.gender} • ${guest.hair_length || 'No hair length specified'}`}
                    onPress={() => handleGuestSelect(guest.id)}
                    left={props => <List.Icon {...props} icon="account-outline" />}
                    right={props => <List.Icon {...props} icon="chevron-right" />}
                    style={styles.listItem}
                  />
                ))}
              </List.Section>
            </>
          )}
          
          <View style={styles.fabSpace} />
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="Add New Guest"
        onPress={handleAddGuest}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginVertical: SPACING.xl,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  sectionTitle: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  listItem: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    marginVertical: 2,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.lg,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.round,
    elevation: 4,
  },
  fabSpace: {
    height: 100, // Space for FAB
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 