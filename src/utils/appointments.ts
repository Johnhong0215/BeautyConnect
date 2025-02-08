import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export interface AppointmentWithService {
  id: string;
  service: {
    name: string;
    description: string;
  };
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest?: {
    full_name: string;
  } | null;
}

export async function getFutureAppointments(userId: string) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
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
        services!appointments_service_id_fkey (
          name,
          description
        ),
        guests!appointments_guest_id_fkey (
          full_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return data?.map(appointment => ({
      id: appointment.id,
      service: {
        name: appointment.services.name,
        description: appointment.services.description
      },
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      duration: appointment.duration,
      total_price: appointment.total_price,
      status: appointment.status,
      guest: appointment.guests ? {
        full_name: appointment.guests.full_name
      } : null
    })) ?? [];

  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
} 