export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  gender: 'male' | 'female';
  age: number;
  hair_length?: 'short' | 'medium' | 'long';
  hair_color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration_male: number;
  duration_female: number;
  price_male: number;
  price_female: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id?: string;
  guest_id?: string;
  service_id: number;
  scheduled_time: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id?: string;
  guest_id?: string;
  service_id: string;
  appointment_date: string;
  duration: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export type Gender = 'male' | 'female'; 