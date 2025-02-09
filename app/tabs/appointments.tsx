import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabase';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number;
  service: {
    name: string;
  };
  guest_id: string | null;
  guest: {
    full_name: string;
  } | null;
}

export default function Appointments() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          total_price,
          guest_id,
          service:services (
            name
          ),
          guest:guests!appointments_guest_id_fkey (
            full_name
          )
        `)
        .eq('user_id', session.user.id)
        .in('status', ['confirmed', 'pending'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const transformedData = data?.map(appointment => {
        return {
          ...appointment,
          service: Array.isArray(appointment.service) ? appointment.service[0] : appointment.service,
          guest: Array.isArray(appointment.guest) ? appointment.guest[0] : appointment.guest
        };
      }) as Appointment[];

      setAppointments(transformedData || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleNewBooking = () => {
    router.push('/tabs');
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);

              if (error) throw error;
              
              // Refresh appointments list
              await fetchAppointments();
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (error) throw error;
      
      // Refresh appointments list
      await fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const isAppointmentPast = (date: string, time: string) => {
    const appointmentDateTime = parseISO(`${date}T${time}`);
    return isPast(appointmentDateTime);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'cancelled': return '#F44336';
      default: return COLORS.textSecondary;
    }
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMMM d, yyyy');
  };

  const getAppointmentFor = (appointment: Appointment) => {
    if (appointment.guest_id && appointment.guest) {
      return appointment.guest.full_name;
    }
    return 'Yourself';
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
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineMedium" style={styles.title}>
            Your Appointments
          </Text>
        </Surface>

        <View style={styles.content}>
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons 
                name="calendar-blank" 
                size={64} 
                color={COLORS.textSecondary} 
              />
              <Text variant="titleMedium" style={styles.emptyText}>
                No upcoming appointments
              </Text>
              <Button
                mode="contained"
                onPress={handleNewBooking}
                style={styles.newBookingButton}
              >
                Book New Appointment
              </Button>
            </View>
          ) : (
            appointments.map((appointment) => (
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
                        {appointment.service?.name
                          ? appointment.service.name
                          : 'Service Unavailable'}
                      </Text>
                      <Text variant="bodyMedium" style={styles.guestName}>
                        For: {getAppointmentFor(appointment)}
                      </Text>
                    </View>
                    <Chip
                      mode="flat"
                      textStyle={{ color: 'white' }}
                      style={[styles.statusChip, { backgroundColor: getStatusColor(appointment.status) }]}
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
                      <Text variant="bodyLarge" style={styles.detailText}>
                        {formatAppointmentDate(appointment.appointment_date)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={20} 
                        color={COLORS.textSecondary} 
                      />
                      <Text variant="bodyLarge" style={styles.detailText}>
                        {format(parseISO(`${appointment.appointment_date}T${appointment.start_time}`), 'h:mm a')} - 
                        {format(parseISO(`${appointment.appointment_date}T${appointment.end_time}`), 'h:mm a')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons 
                        name="currency-usd" 
                        size={20} 
                        color={COLORS.textSecondary} 
                      />
                      <Text variant="bodyLarge" style={styles.detailText}>
                        ${appointment.total_price.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {appointment.status === 'confirmed' && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => handleCancelAppointment(appointment.id)}
                        style={styles.cancelButton}
                        textColor={COLORS.error}
                      >
                        Cancel Appointment
                      </Button>
                    </View>
                  )}

                  {appointment.status === 'confirmed' &&
                    isAppointmentPast(appointment.appointment_date, appointment.end_time) && (
                    <View style={styles.completeButton}>
                      <Button
                        mode="contained"
                        onPress={() => handleComplete(appointment.id)}
                        style={styles.completeButton}
                      >
                        Mark as Completed
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
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
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  newBookingButton: {
    marginTop: SPACING.md,
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
  actionButtons: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    borderColor: COLORS.error,
  },
  completeButton: {
    marginTop: SPACING.md,
  },
});
