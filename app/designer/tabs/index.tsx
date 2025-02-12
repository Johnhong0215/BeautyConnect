import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Surface, Portal, Modal, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth, AuthProvider } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/services/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING, DESIGNER_COLORS } from '@/constants/theme';
import { ModeProvider } from '../../../src/contexts/ModeContext';

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
  const [showAddSalon, setShowAddSalon] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchSalons();
    }
  }, [session]);

  const fetchSalons = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('hair_salon')
        .select('id, name, address, phone, email')
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
        <Text variant="headlineMedium" style={styles.headerText}>Designer Dashboard</Text>
      </Surface>
      
      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statsWrapper}>
            <Card style={styles.statsCard}>
              <Card.Content style={styles.statsContent}>
                <MaterialCommunityIcons name="calendar-check" size={32} color={DESIGNER_COLORS.primary} />
                <Text variant="titleLarge" style={styles.statsNumber}>12</Text>
                <Text variant="bodyMedium" style={styles.statsLabel}>Today's Appointments</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.statsWrapper}>
            <Card style={styles.statsCard}>
              <Card.Content style={styles.statsContent}>
                <MaterialCommunityIcons name="clock-outline" size={32} color={DESIGNER_COLORS.primary} />
                <Text variant="titleLarge" style={styles.statsNumber}>4</Text>
                <Text variant="bodyMedium" style={styles.statsLabel}>Pending Requests</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <View style={styles.gapBelowStats} />
        
        <Text variant="titleLarge" style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="calendar"
            style={[styles.actionButton, { backgroundColor: DESIGNER_COLORS.primary }]}
            onPress={() => {}}
          >
            View Schedule
          </Button>
          
          <Button
            mode="contained"
            icon="account-multiple"
            style={[styles.actionButton, { backgroundColor: DESIGNER_COLORS.secondary }]}
            onPress={() => {}}
          >
            Manage Clients
          </Button>
        </View>

        <View style={styles.gapBelowActions} />

        <Text variant="titleLarge" style={styles.sectionTitle}>My Businesses</Text>
        <Button
          mode="contained"
          onPress={() => router.push('/salon/setup?mode=add&returnTo=/designer/tabs&theme=designer')}
          icon="plus"
        >
          Add New Business
        </Button>
        <View style={styles.salonList}>
          {salons.map(salon => (
            <Card key={salon.id} style={styles.salonCard}>
              <Card.Content>
                <View style={styles.salonHeader}>
                  <MaterialCommunityIcons name="store" size={24} color={DESIGNER_COLORS.primary} />
                  <Text variant="titleMedium" style={styles.salonName}>{salon.name}</Text>
                </View>
                <View style={styles.salonInfo}>
                  <Text variant="bodyMedium" style={styles.salonDetail}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={DESIGNER_COLORS.textSecondary} />
                    {' '}{salon.address}
                  </Text>
                  <Text variant="bodyMedium" style={styles.salonDetail}>
                    <MaterialCommunityIcons name="phone" size={16} color={DESIGNER_COLORS.textSecondary} />
                    {' '}{salon.phone}
                  </Text>
                  <Text variant="bodyMedium" style={styles.salonDetail}>
                    <MaterialCommunityIcons name="email" size={16} color={DESIGNER_COLORS.textSecondary} />
                    {' '}{salon.email}
                  </Text>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="outlined" 
                  onPress={() => router.push(`/salon/${salon.id}`)}
                  style={styles.salonButton}
                  textColor={DESIGNER_COLORS.primary}
                >
                  Manage
                </Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={showAddSalon}
          onDismiss={() => setShowAddSalon(false)}
          style={{ margin: 0 }}
        >
          <View style={styles.modalContainer}>
            <ModeProvider>
              <AuthProvider>
                <Surface style={styles.modalHeader}>
                  <IconButton 
                    icon="close" 
                    onPress={() => setShowAddSalon(false)} 
                  />
                </Surface>
              </AuthProvider>
            </ModeProvider>
          </View>
        </Modal>
      </Portal>
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
    elevation: 4,
  },
  headerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  statsWrapper: {
    flex: 1,
    marginRight: SPACING.md,
  },
  statsCard: {
    height: 120,
    backgroundColor: DESIGNER_COLORS.surface,
    borderRadius: 12,
    elevation: 2,
  },
  statsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  statsNumber: {
    color: DESIGNER_COLORS.primary,
    fontWeight: 'bold',
    marginVertical: SPACING.xs,
  },
  statsLabel: {
    color: DESIGNER_COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    color: DESIGNER_COLORS.text,
    fontWeight: '600',
  },
  actionButtons: {
    gap: SPACING.md,
  },
  actionButton: {
    marginBottom: SPACING.sm,
    borderRadius: 8,
  },
  gapBelowStats: {
    height: SPACING.xl,
  },
  gapBelowActions: {
    height: SPACING.xl * 2,
  },
  salonList: {
    gap: SPACING.md,
  },
  salonCard: {
    backgroundColor: DESIGNER_COLORS.surface,
    borderRadius: 12,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  salonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  salonName: {
    marginLeft: SPACING.sm,
    color: DESIGNER_COLORS.text,
    fontWeight: '600',
  },
  salonInfo: {
    gap: SPACING.xs,
  },
  salonDetail: {
    color: DESIGNER_COLORS.textSecondary,
  },
  salonButton: {
    borderColor: DESIGNER_COLORS.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: DESIGNER_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.sm,
    backgroundColor: DESIGNER_COLORS.surface,
  },
});
