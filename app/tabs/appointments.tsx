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
  salon_name: string;
  hair_salon: {
    name: string;
  } | null;
}

export default function Appointments() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<Record<string, Appointment[]>>({});

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
          ),
          hair_salon:salon_id (
            name
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
          guest: Array.isArray(appointment.guest) ? appointment.guest[0] : appointment.guest,
          hair_salon: Array.isArray(appointment.hair_salon) ? appointment.hair_salon[0] : appointment.hair_salon
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

  useEffect(() => {
    // Group appointments by date
    const grouped = appointments.reduce((acc, appointment) => {
      const date = appointment.appointment_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);
    
    setGroupedAppointments(grouped);
  }, [appointments]);

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

  const formatDateHeader = (date: string) => {
    const parsedDate = parseISO(date);
    if (isToday(parsedDate)) return 'Today';
    if (isTomorrow(parsedDate)) return 'Tomorrow';
    return format(parsedDate, 'MMMM d, yyyy');
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
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineMedium">My Appointments</Text>
      </Surface>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS.primary} />
          <Text variant="titleMedium" style={styles.emptyText}>No appointments yet</Text>
          <Button 
            mode="contained" 
            onPress={() => router.push('/booking')}
            style={styles.bookButton}
          >
            Book Now
          </Button>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Group appointments by date */}
          {Object.entries(groupedAppointments).map(([date, appointments]) => (
            <View key={date} style={styles.dateGroup}>
              <Text variant="titleSmall" style={styles.dateHeader}>
                {formatDateHeader(date)}
              </Text>
              {appointments.map(appointment => (
                <Card 
                  key={appointment.id} 
                  style={styles.appointmentCard} 
                  mode="elevated"
                >
                  <Card.Content>
                    <View style={styles.appointmentHeader}>
                      <View style={styles.serviceInfo}>
                        <Text variant="titleMedium" style={styles.serviceName}>
                          {appointment.service?.name}
                        </Text>
                        <Chip 
                          mode="flat" 
                          style={[styles.statusChip, { backgroundColor: getStatusColor(appointment.status) }]}
                        >
                          {appointment.status}
                        </Chip>
                      </View>
                      <Text variant="titleMedium" style={styles.price}>
                        ${appointment.total_price.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.appointmentDetails}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="store" size={18} color={COLORS.primary} />
                        <Text variant="bodyMedium" style={styles.detailText}>
                          {appointment.hair_salon?.name}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="clock" size={18} color={COLORS.primary} />
                        <Text variant="bodyMedium" style={styles.detailText}>
                          {format(parseISO(`${appointment.appointment_date}T${appointment.start_time}`), 'h:mm a')}
                        </Text>
                      </View>
                      {appointment.guest_id && appointment.guest && (
                        <View style={styles.detailRow}>
                          <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
                          <Text variant="bodyMedium" style={styles.detailText}>
                            Guest: {appointment.guest.full_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {appointment.status === 'confirmed' && (
                      <View style={styles.actionButtons}>
                        <Button 
                          mode="outlined" 
                          onPress={() => handleCancelAppointment(appointment.id)}
                          style={styles.actionButton}
                        >
                          Cancel
                        </Button>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
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
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
    padding: SPACING.md,
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xs,
  },
  appointmentCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  serviceInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  serviceName: {
    marginBottom: SPACING.xs,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  price: {
    color: COLORS.primary,
  },
  appointmentDetails: {
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: COLORS.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    color: COLORS.textSecondary,
  },
  bookButton: {
    minWidth: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
