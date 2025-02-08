export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          user_id: string | null
          guest_id: string | null
          service_id: string
          appointment_date: string
          duration: number
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          cancellation_reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_id?: string | null
          service_id: string
          appointment_date: string
          duration: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_id?: string | null
          service_id?: string
          appointment_date?: string
          duration?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      // ... other tables
    }
  }
} 