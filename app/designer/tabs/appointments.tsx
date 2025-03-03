import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../src/services/supabase';
import { useAuth } from '../../../src/contexts/AuthContext';
import { SPACING } from '../../../src/constants/theme';
import { DESIGNER_COLORS } from '../../../src/constants/colors';
import { format, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: string;
  notes?: string;
  service?: {
    name: string;
  } | null;
  owner?: {
    full_name: string;
  } | null;
  client?: {
    full_name: string;
  } | null;
  salon?: {
    name: string;
  } | null;
}

export default function DesignerAppointments() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (session?.user) {
      fetchAppointments();
    }
  }, [session]);

  const fetchAppointments = async () => {
    try {
      if (!session?.user) return;

      // First, fetch salons owned by the current user.
      const { data: salons, error: salonError } = await supabase
        .from('hair_salon')
        .select('id')
        .eq('owner_id', session.user.id);

      if (salonError) throw salonError;

      if (!salons?.length) {
        setAppointments([]);
        return;
      }

      const salonIds = salons.map((salon) => salon.id);

      // Next, fetch appointments for those salons
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          duration,
          total_price,
          status,
          notes,
          guest_id,
          services:services!service_id (
            name
          ),
          owner:profiles!user_id (
            full_name
          ),
          client:guests!guest_id (
            full_name
          ),
          salon:hair_salon!salon_id (
            name
          )
        `)
        .in('salon_id', salonIds)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        setAppointments([]);
        return;
      }

      // Transform the data. Notice that the 'services' field is an array,
      // so we check if it exists and use its first element.
      const transformedData = data?.map(apt => ({
        ...apt,
        service: Array.isArray(apt.services) ? apt.services[0] : apt.services,
        owner: Array.isArray(apt.owner) ? apt.owner[0] : apt.owner,
        client: apt.guest_id ? 
          (Array.isArray(apt.client) ? apt.client[0] : apt.client) : 
          (Array.isArray(apt.owner) ? apt.owner[0] : apt.owner),
        salon: Array.isArray(apt.salon) ? apt.salon[0] : apt.salon
      })) as Appointment[];

      setAppointments(transformedData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];

    switch (filter) {
      case 'upcoming':
        return appointments.filter(
          (apt) => apt.appointment_date >= today && apt.status === 'confirmed'
        );
      case 'completed':
        return appointments.filter((apt) => apt.status === 'completed');
      case 'cancelled':
        return appointments.filter((apt) => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'cancelled':
        return DESIGNER_COLORS.error;
      default:
        return DESIGNER_COLORS.textSecondary;
    }
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={DESIGNER_COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>
          Appointments
        </Text>
      </View>

      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        style={styles.filterButtons}
      />

      <ScrollView style={styles.content}>
        {getFilteredAppointments().map((appointment) => (
          <Card key={appointment.id} style={styles.appointmentCard}>
            <Card.Content>
              <View style={styles.appointmentHeader}>
                <Text variant="titleMedium" style={styles.serviceName}>
                  {appointment.service?.name}
                </Text>
                <Chip
                  textStyle={{ color: getStatusColor(appointment.status) }}
                  style={styles.statusChip}
                >
                  {appointment.status}
                </Chip>
              </View>

              <View style={styles.appointmentDetails}>
                <Text variant="bodyMedium" style={styles.detail}>
                  {formatAppointmentDate(appointment.appointment_date)}
                </Text>
                <Text variant="bodyMedium" style={styles.detail}>
                  {appointment.start_time} - {appointment.end_time}
                </Text>
                <Text variant="bodyMedium" style={styles.detail}>
                  Owner: {appointment.owner?.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.detail}>
                  Client: {appointment.client?.full_name}
                </Text>
                <Text variant="bodyMedium" style={styles.detail}>
                  Salon: {appointment.salon?.name}
                </Text>
                <Text variant="bodyMedium" style={styles.price}>
                  ${appointment.total_price}
                </Text>
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
  filterButtons: {
    margin: SPACING.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  appointmentCard: {
    marginBottom: SPACING.md,
    backgroundColor: DESIGNER_COLORS.surface,
    borderRadius: 12,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  serviceName: {
    color: DESIGNER_COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    backgroundColor: DESIGNER_COLORS.surface,
    borderWidth: 1,
    borderColor: DESIGNER_COLORS.border,
  },
  appointmentDetails: {
    gap: SPACING.xs,
  },
  detail: {
    color: DESIGNER_COLORS.textSecondary,
  },
  price: {
    color: DESIGNER_COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});
