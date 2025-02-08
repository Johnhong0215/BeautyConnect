import { supabase } from '../services/supabase';
import { format, parseISO, addMinutes } from 'date-fns';

interface TimeSlot {
  start_time: string;
  isAvailable: boolean;
}

export async function getAvailableTimeSlots(date: string | Date, duration: number) {
  try {
    // Validate inputs
    if (!date || typeof duration !== 'number' || isNaN(duration)) {
      return [];
    }

    // Convert date to string if it's a Date object
    const dateString = date instanceof Date ? format(date, 'yyyy-MM-dd') : date;
    const selectedDate = parseISO(dateString);

    // Validate parsed date
    if (isNaN(selectedDate.getTime())) {
      return [];
    }

    const dayNum = selectedDate.getDay();

    // Validate day number
    if (typeof dayNum !== 'number' || isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      return [];
    }

    // Get business hours for the selected day
    const { data: businessHours, error: hoursError } = await supabase
      .from('business_hours')
      .select('*')
      .eq('day_of_week', parseInt(dayNum.toString()))
      .single();

    if (hoursError || !businessHours || businessHours.is_closed) {
      return [];
    }

    // Get existing appointments for the selected date
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time, status')
      .eq('appointment_date', formattedDate)
      .in('status', ['confirmed', 'pending'])
      .order('start_time');  // Order appointments by start time

    if (appointmentsError) {
      return [];
    }

    // Create a map of all booked time slots
    const bookedSlots = new Map<string, boolean>();
    
    // Mark all booked slots
    existingAppointments?.forEach(appointment => {
      const appointmentDate = parseISO(appointment.appointment_date);
      const startTime = new Date(appointmentDate);
      const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(appointmentDate);
      const [endHour, endMinute] = appointment.end_time.split(':').map(Number);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Mark only the exact duration of the appointment
      let checkTime = new Date(startTime);
      while (checkTime < endTime) {
        bookedSlots.set(format(checkTime, 'HH:mm'), true);
        checkTime = addMinutes(checkTime, 5);
      }
    });

    // Generate available time slots
    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = businessHours.open_time.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.close_time.split(':').map(Number);
    
    let currentTime = new Date(selectedDate);
    currentTime.setHours(openHour, openMinute, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    // Adjust endTime to account for service duration
    const lastPossibleStart = addMinutes(endTime, -duration);

    while (currentTime <= lastPossibleStart) {
      const timeString = format(currentTime, 'HH:mm');
      const slotEndTime = addMinutes(currentTime, duration);

      // Skip if slot is in the past
      if (currentTime < new Date()) {
        currentTime = addMinutes(currentTime, 5);
        continue;
      }

      // Check if any part of this time slot is booked
      let isSlotAvailable = true;
      let checkTime = new Date(currentTime);
      
      while (checkTime < slotEndTime) {
        if (bookedSlots.has(format(checkTime, 'HH:mm'))) {
          isSlotAvailable = false;
          break;
        }
        checkTime = addMinutes(checkTime, 5);
      }

      // Only add slots that have the full duration available
      if (isSlotAvailable) {
        slots.push({
          start_time: timeString,
          isAvailable: true
        });
      }

      currentTime = addMinutes(currentTime, 5);
    }

    return slots;
  } catch (error) {
    return [];
  }
} 