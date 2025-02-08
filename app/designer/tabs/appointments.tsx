import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/services/supabase';
import { COLORS, SPACING } from '../../../src/constants/theme';
import { format, parseISO } from 'date-fns';

interface AppointmentResponse {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  user_id: string;
  service_id: string;
  users: { full_name: string }[];
  services: { name: string }[];
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  user: { full_name: string };
  services: { name: string };
}

export default function DesignerAppointments() {
  const { session } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    if (!session?.user) return;

    try {
      // First get the salon_id
      const { data: salon } = await supabase
        .from('hair_salon')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (!salon) return;

      // Update the join query to use the correct relationships
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          user_id,
          service_id,
          users:user_id (full_name),
          services:service_id (name)
        `)
        .eq('salon_id', salon.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Transform the data to match the interface
      const transformedData = data?.map((appointment: AppointmentResponse): Appointment => ({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        user: { full_name: appointment.users[0].full_name },
        services: { name: appointment.services[0].name }
      }));

      setAppointments(transformedData || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Appointments</Text>
        <Chip mode="flat" style={styles.modeChip}>Designer</Chip>
      </Surface>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {appointments.map(appointment => (
          <Card key={appointment.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{appointment.services.name}</Text>
              <Text variant="bodyMedium">Client: {appointment.user.full_name}</Text>
              <Text variant="bodyMedium">
                {format(parseISO(appointment.appointment_date), 'MMMM d, yyyy')}
              </Text>
              <Text variant="bodyMedium">
                {format(parseISO(`${appointment.appointment_date}T${appointment.start_time}`), 'h:mm a')} - 
                {format(parseISO(`${appointment.appointment_date}T${appointment.end_time}`), 'h:mm a')}
              </Text>
              <Chip>{appointment.status}</Chip>
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