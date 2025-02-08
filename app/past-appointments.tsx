import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text, List, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';

export default function PastAppointments() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchPastAppointments();
  }, []);

  const fetchPastAppointments = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          services!appointments_service_id_fkey (
            name
          ),
          guests (
            full_name
          )
        `)
        .eq('user_id', session.user.id)
        .in('status', ['completed', 'cancelled'])
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setPastAppointments(data || []);
    } catch (error) {
      console.error('Error fetching past appointments:', error);
    } finally {
      setLoading(false);
    }
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
          Past Appointments
        </Text>
      </Surface>

      <ScrollView style={styles.content}>
        {pastAppointments.map(appointment => (
          <Card key={appointment.id} style={styles.appointmentCard} mode="elevated">
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.serviceIcon}>
                  <MaterialCommunityIcons 
                    name="content-cut" 
                    size={24} 
                    color={COLORS.primary} 
                  />
                </View>
                <View style={styles.headerText}>
                  <Text variant="titleMedium" style={styles.serviceName}>
                    {appointment.services?.name || 'Service Unavailable'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.guestName}>
                    For: {appointment.guests?.[0]?.full_name || 'Yourself'}
                  </Text>
                </View>
                <Chip
                  mode="flat"
                  textStyle={{ color: 'white' }}
                  style={[
                    styles.statusChip,
                    { 
                      backgroundColor: appointment.status === 'completed' 
                        ? COLORS.success 
                        : COLORS.error 
                    }
                  ]}
                >
                  {appointment.status}
                </Chip>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons 
                    name="calendar" 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                  <Text variant="bodyMedium" style={styles.detailText}>
                    {format(parseISO(appointment.appointment_date), 'MMMM d, yyyy')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={20} 
                    color={COLORS.textSecondary} 
                  />
                  <Text variant="bodyMedium" style={styles.detailText}>
                    {format(parseISO(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - 
                    {format(parseISO(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                  </Text>
                </View>
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
  appointmentCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  serviceIcon: {
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
  serviceName: {
    fontWeight: '600',
    color: COLORS.text,
  },
  guestName: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    borderRadius: BORDER_RADIUS.round,
  },
  appointmentDetails: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 