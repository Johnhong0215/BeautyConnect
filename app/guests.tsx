import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, FAB, Surface, Card, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { router, useFocusEffect } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Guest {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  hair_length?: string;
}

export default function Guests() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchGuests();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGuests();
    setRefreshing(false);
  }, []);

  const fetchGuests = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
      Alert.alert('Error', 'Failed to load guests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the guest form in "edit" mode, passing the guest data as params.
  const handleGuestEdit = (guest: Guest) => {
    router.push({
      pathname: '/booking/guest-form',
      params: {
        mode: 'edit',
        guestId: guest.id,
        fullName: guest.full_name,
        age: guest.age.toString(),
        gender: guest.gender,
        hairLength: guest.hair_length,
      },
    });
  };

  const handleGuestSelect = (guestId: string) => {
    // After selecting guest, always go to salon selection
    router.push({
      pathname: '/booking/select-salon',
      params: { guestId }
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
      <Surface style={styles.header} elevation={0}>
        <Text variant="headlineMedium" style={styles.title}>
          Your Guests
        </Text>
      </Surface>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
          />
        }
      >
        {guests.map((guest) => (
          <TouchableRipple key={guest.id} onPress={() => handleGuestEdit(guest)}>
            <Card style={styles.guestCard} mode="elevated">
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.headerText}>
                    <Text variant="titleMedium" style={styles.guestName}>
                      {guest.full_name}
                    </Text>
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailChip}>
                        <MaterialCommunityIcons name="human-male-height" size={16} color={COLORS.textSecondary} />
                        <Text variant="bodyMedium" style={styles.detailText}>
                          {guest.age} years
                        </Text>
                      </View>
                      <View style={styles.detailChip}>
                        <MaterialCommunityIcons name="gender-male-female" size={16} color={COLORS.textSecondary} />
                        <Text variant="bodyMedium" style={styles.detailText}>
                          {guest.gender}
                        </Text>
                      </View>
                      {guest.hair_length && (
                        <View style={styles.detailChip}>
                          <MaterialCommunityIcons name="hair-dryer" size={16} color={COLORS.textSecondary} />
                          <Text variant="bodyMedium" style={styles.detailText}>
                            {guest.hair_length}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </TouchableRipple>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Guest"
        onPress={() => router.push('/booking/guest-form')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
  },
  guestCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  guestName: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  detailText: {
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.lg,
    right: 0,
    bottom: 0,
  },
});
