import { createContext, useContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface Salon {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_male: number;
  duration_female: number;
  price_male: number;
  price_female: number;
  type?: 'hair' | 'nail';  // Make type optional
  created_at: string;
  salon_id: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  date: string;
  id?: string;
}

interface BookingContextType {
  selectedSalon: Salon | null;
  selectedService: Service | null;
  selectedTimeSlot: TimeSlot | null;
  isForGuest: boolean;
  guestId: string | null;
  currentStep: 'start' | 'salon' | 'service' | 'date' | 'time' | 'confirm';
  goToNextStep: () => void;
  setSelectedSalon: (salon: Salon | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedTimeSlot: (slot: TimeSlot | null) => void;
  setIsForGuest: (isGuest: boolean) => void;
  setGuestId: (id: string | null) => void;
  setCurrentStep: (step: 'start' | 'salon' | 'service' | 'date' | 'time' | 'confirm') => void;
  getNearbyHairSalons: (radius?: number) => Promise<Salon[]>;
  getAvailableServices: (salonId: string, serviceType: 'hair' | 'nail') => Promise<Service[]>;
  getAvailableTimeSlots: (date: string) => Promise<TimeSlot[]>;
  confirmBooking: () => Promise<{ id: string } | null>;
  resetBooking: () => void;
  startNewBooking: (isGuest: boolean) => void;
  handleStepNavigation: (nextStep: string) => void;
  handleSalonSelect: (salon: Salon) => void;
  handleServiceSelect: (service: Service) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [isForGuest, setIsForGuest] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'start' | 'salon' | 'service' | 'date' | 'time' | 'confirm'>('start');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Reset booking state when app goes to background
      if (nextAppState.match(/inactive|background/)) {
        resetBooking();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const resetBooking = () => {
    setSelectedSalon(null);
    setSelectedService(null);
    setSelectedTimeSlot(null);
    setIsForGuest(false);
    setGuestId(null);
    setCurrentStep('start');
  };

  const handleStepNavigation = async (nextStep: string) => {
    try {
      // Always check current state before navigation
      if (nextStep === 'service' && !selectedSalon) {
        router.replace('/booking/select-salon');
        return;
      }

      // Set state first, then navigate
      await setCurrentStep(nextStep);
      await new Promise(resolve => setTimeout(resolve, 0));

      switch (nextStep) {
        case 'salon':
          router.replace('/booking/select-salon');
          break;
        case 'service':
          router.push('/booking/service-selection');
          break;
        case 'time':
          router.push('/booking/time-selection');
          break;
        case 'confirm':
          router.push('/booking/confirmation');
          break;
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Navigation failed. Please try again.');
    }
  };

  const startNewBooking = (isGuest: boolean) => {
    // Always reset everything first
    resetBooking();
    setIsForGuest(isGuest);
    router.replace('/booking/select-salon');
  };

  const handleSalonSelect = (salon: Salon) => {
    setSelectedSalon(salon);
    router.push({
      pathname: '/booking/service-selection',
      params: { 
        serviceType: 'hair', // or pass this from previous context
        guestId: guestId // if exists
      }
    });
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    router.push('/booking/date-selection');
  };

  const getNearbyHairSalons = async (radius: number = 5000) => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      console.log('Current location:', location); // Debug log

      if (!location || !location.coords) {
        throw new Error('Could not get location coordinates');
      }
      
      const { data: salons, error } = await supabase
        .rpc('nearby_salons', {
          search_lat: location.coords.latitude,
          search_lng: location.coords.longitude,
          radius_meters: radius
        });

      if (error) throw error;
      console.log('Raw salon data:', salons); // Debug log

      if (!salons || !Array.isArray(salons)) {
        return [];
      }

      // Transform the data to match our Salon interface
      return salons.map(salon => {
        if (!salon.location || !salon.location.coordinates) {
          // Return salon without location if coordinates are missing
          return {
            id: salon.id,
            name: salon.name,
            address: salon.address,
            location: {
              latitude: 0,
              longitude: 0
            }
          };
        }

        return {
          id: salon.id,
          name: salon.name,
          address: salon.address,
          location: {
            latitude: Number(salon.location.coordinates[1]),
            longitude: Number(salon.location.coordinates[0])
          }
        };
      });
    } catch (error) {
      console.error('Error fetching nearby salons:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return [];
    }
  };

  const getAvailableServices = async (salonId: string, serviceType: 'hair' | 'nail') => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('type', serviceType);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  };

  const getAvailableTimeSlots = async (date: string): Promise<TimeSlot[]> => {
    try {
      if (!selectedSalon || !selectedService) return [];

      const duration = selectedService.duration_male; // or duration_female based on user

      const { data, error } = await supabase.rpc('get_available_time_slots', {
        p_salon_id: selectedSalon.id,
        p_service_id: selectedService.id,
        p_date: date,
        p_duration: duration
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return [];
    }
  };

  const confirmBooking = async (): Promise<{ id: string } | null> => {
    if (!selectedSalon || !selectedService || !selectedTimeSlot || !session?.user) {
      throw new Error('Missing booking information');
    }

    try {
      const appointmentData = {
        salon_id: selectedSalon.id,
        service_id: selectedService.id,
        user_id: session.user.id,
        guest_id: isForGuest ? guestId : null,  // Only set guest_id if booking for a guest
        appointment_date: selectedTimeSlot.date,
        start_time: selectedTimeSlot.start_time,
        end_time: selectedTimeSlot.end_time,
        duration: isForGuest ? selectedService.duration_female : selectedService.duration_male,
        total_price: isForGuest ? selectedService.price_female : selectedService.price_male,
        status: 'confirmed'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  };

  return (
    <BookingContext.Provider value={{
      selectedSalon,
      selectedService,
      selectedTimeSlot,
      isForGuest,
      guestId,
      currentStep,
      goToNextStep: handleStepNavigation,
      setSelectedSalon,
      setSelectedService,
      setSelectedTimeSlot,
      setIsForGuest,
      setGuestId,
      setCurrentStep,
      getNearbyHairSalons,
      getAvailableServices,
      getAvailableTimeSlots,
      confirmBooking,
      resetBooking,
      startNewBooking,
      handleStepNavigation,
      handleSalonSelect,
      handleServiceSelect,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}; 