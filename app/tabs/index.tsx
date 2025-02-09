import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { supabase } from '../../src/services/supabase';
import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Home() {
  const { session } = useAuth();
  const { resetBooking } = useBooking();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!session?.user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleServiceSelect = (serviceType: 'hair' | 'nail') => {
    resetBooking();
    if (serviceType === 'hair') {
      router.push('/booking/guest-list');
    } else {
      router.push({
        pathname: '/booking/select-salon',
        params: { serviceType }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            Welcome back!
          </Text>
          <Text variant="titleLarge" style={styles.nameText}>
            {userName}
          </Text>
        </Surface>

        <Text variant="titleLarge" style={styles.questionText}>
          What would you like to style today?
        </Text>

        <View style={styles.servicesContainer}>
          <View style={styles.cardWrapper}>
            <Card style={styles.serviceCard} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name="content-cut" 
                    size={32} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text variant="headlineSmall" style={styles.serviceTitle}>
                  Hair
                </Text>
                <Text variant="bodyLarge" style={styles.serviceDescription}>
                  Professional hair styling services including cuts, coloring, and treatments
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => handleServiceSelect('hair')}
                  style={styles.bookButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Book Now
                </Button>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.cardWrapper}>
            <Card style={styles.serviceCard} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons 
                    name="hand-wave" 
                    size={32} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text variant="headlineSmall" style={styles.serviceTitle}>
                  Nail
                </Text>
                <Text variant="bodyLarge" style={styles.serviceDescription}>
                  Professional nail care services including manicures and pedicures
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => handleServiceSelect('nail')}
                  style={styles.bookButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  Book Now
                </Button>
              </Card.Content>
            </Card>
          </View>
        </View>
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
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nameText: {
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: '600',
    fontSize: 28,
  },
  questionText: {
    color: COLORS.text,
    padding: SPACING.lg,
    fontWeight: '600',
  },
  servicesContainer: {
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
  cardWrapper: {
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  serviceCard: {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  serviceTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  serviceDescription: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  bookButton: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    elevation: 0,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 