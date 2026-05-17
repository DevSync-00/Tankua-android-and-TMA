// Database Types - Generated from Supabase schema
// Update this file when database schema changes

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
      users: {
        Row: {
          id: string
          phone_number: string
          name: string | null
          email: string | null
          avatar_url: string | null
          emergency_contact: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          emergency_contact?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          emergency_contact?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      destinations: {
        Row: {
          id: string
          name: string
          description: string | null
          region: string | null
          city: string | null
          category: 'religious' | 'sacred' | 'historical' | 'nature' | 'adventure' | 'cultural' | 'city' | 'monument' | 'park' | 'museum' | 'other'
          location: Json | null
          images: string[] | null
          tags: string[] | null
          distance: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          region?: string | null
          city?: string | null
          category?: 'religious' | 'sacred' | 'historical' | 'nature' | 'adventure' | 'cultural' | 'city' | 'monument' | 'park' | 'museum' | 'other'
          location?: Json | null
          images?: string[] | null
          tags?: string[] | null
          distance?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          region?: string | null
          city?: string | null
          category?: 'religious' | 'sacred' | 'historical' | 'nature' | 'adventure' | 'cultural' | 'city' | 'monument' | 'park' | 'museum' | 'other'
          location?: Json | null
          images?: string[] | null
          tags?: string[] | null
          distance?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      providers: {
        Row: {
          id: string
          name: string
          description: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          rating: number
          total_trips: number
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          rating?: number
          total_trips?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          rating?: number
          total_trips?: number
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          destination_id: string | null
          provider_id: string | null
          trip_type: 'group' | 'private' | 'holiday'
          tour_category: 'day_trip' | 'multi_day' | 'weekend' | 'holiday' | 'custom' | null
          departure_date: string
          return_date: string | null
          price: number
          max_seats: number
          available_seats: number
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          destination_id?: string | null
          provider_id?: string | null
          trip_type?: 'group' | 'private' | 'holiday'
          tour_category?: 'day_trip' | 'multi_day' | 'weekend' | 'holiday' | 'custom' | null
          departure_date: string
          return_date?: string | null
          price: number
          max_seats: number
          available_seats?: number
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          destination_id?: string | null
          provider_id?: string | null
          trip_type?: 'group' | 'private' | 'holiday'
          tour_category?: 'day_trip' | 'multi_day' | 'weekend' | 'holiday' | 'custom' | null
          departure_date?: string
          return_date?: string | null
          price?: number
          max_seats?: number
          available_seats?: number
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          trip_id: string
          pickup_station_id: string | null
          seats: number
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'refunded'
          payment_method: string | null
          payment_deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          trip_id: string
          pickup_station_id?: string | null
          seats?: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_method?: string | null
          payment_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          trip_id?: string
          pickup_station_id?: string | null
          seats?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          payment_method?: string | null
          payment_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pickup_stations: {
        Row: {
          id: string
          name: string
          address: string | null
          latitude: number | null
          longitude: number | null
          city: string | null
          extra_price: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
          extra_price?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          city?: string | null
          extra_price?: number
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          provider_id: string | null
          name: string
          phone: string | null
          license_number: string | null
          avatar_url: string | null
          rating: number
          status: 'available' | 'on_trip' | 'offline'
          created_at: string
        }
        Insert: {
          id?: string
          provider_id?: string | null
          name: string
          phone?: string | null
          license_number?: string | null
          avatar_url?: string | null
          rating?: number
          status?: 'available' | 'on_trip' | 'offline'
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string | null
          name?: string
          phone?: string | null
          license_number?: string | null
          avatar_url?: string | null
          rating?: number
          status?: 'available' | 'on_trip' | 'offline'
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          booking_id: string | null
          user_id: string | null
          amount: number
          currency: string
          payment_method: string
          transaction_ref: string
          external_ref: string | null
          checkout_url: string | null
          status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded'
          provider_response: Json | null
          error_message: string | null
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          user_id?: string | null
          amount: number
          currency?: string
          payment_method: string
          transaction_ref: string
          external_ref?: string | null
          checkout_url?: string | null
          status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded'
          provider_response?: Json | null
          error_message?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string | null
          user_id?: string | null
          amount?: number
          currency?: string
          payment_method?: string
          transaction_ref?: string
          external_ref?: string | null
          checkout_url?: string | null
          status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded'
          provider_response?: Json | null
          error_message?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          provider_id: string
          rating: number
          comment: string | null
          provider_response: string | null
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          provider_id: string
          rating: number
          comment?: string | null
          provider_response?: string | null
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          user_id?: string
          provider_id?: string
          rating?: number
          comment?: string | null
          provider_response?: string | null
          is_visible?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Common types
export type User = Tables<'users'>
export type Destination = Tables<'destinations'>
export type Provider = Tables<'providers'>
export type Trip = Tables<'trips'>
export type Booking = Tables<'bookings'>
export type PickupStation = Tables<'pickup_stations'>
export type Driver = Tables<'drivers'>
export type PaymentTransaction = Tables<'payment_transactions'>
export type Review = Tables<'reviews'>

// Extended types with relations
export type BookingWithDetails = Booking & {
  user?: User
  trip?: Trip & {
    destination?: Destination
    provider?: Provider
  }
  pickup_station?: PickupStation
}

export type TripWithDetails = Trip & {
  destination?: Destination
  provider?: Provider
  bookings?: Booking[]
}


