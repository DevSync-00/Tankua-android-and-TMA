import { supabase } from './client';
import type { 
  User, Destination, Provider, Trip, Booking, PickupStation, Driver,
  BookingWithDetails, TripWithDetails, PaymentTransaction
} from './types';

// ============================================
// DASHBOARD STATISTICS
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  activeTrips: number;
  totalProviders: number;
  totalRevenue: number;
  recentBookings: BookingWithDetails[];
  topProviders: (Provider & { bookingCount: number; revenue: number })[];
  topDestinations: (Destination & { bookingCount: number })[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all stats in parallel
  const [
    usersResult,
    bookingsResult,
    tripsResult,
    providersResult,
    revenueResult,
    recentBookingsResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('total_price').eq('payment_status', 'paid'),
    supabase
      .from('bookings')
      .select(`
        *,
        user:users(id, name, phone_number),
        trip:trips(
          id,
          departure_date,
          price,
          destination:destinations(id, name, city, category),
          provider:providers(id, name)
        ),
        pickup_station:pickup_stations(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Calculate total revenue
  const totalRevenue = revenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalBookings: bookingsResult.count || 0,
    activeTrips: tripsResult.count || 0,
    totalProviders: providersResult.count || 0,
    totalRevenue,
    recentBookings: (recentBookingsResult.data || []) as unknown as BookingWithDetails[],
    topProviders: [],
    topDestinations: [],
  };
}

// ============================================
// USERS
// ============================================

export async function getUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,phone_number.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { users: data as User[], total: count || 0 };
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

// ============================================
// DESTINATIONS
// ============================================

export async function getDestinations(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  region?: string;
  category?: string;
}) {
  let query = supabase
    .from('destinations')
    .select('*', { count: 'exact' })
    .order('name');

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,city.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.region) {
    query = query.eq('region', options.region);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { destinations: data as Destination[], total: count || 0 };
}

export async function getDestinationById(id: string) {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Destination;
}

export async function createDestination(destination: Omit<Destination, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('destinations')
    .insert(destination)
    .select()
    .single();

  if (error) throw error;
  return data as Destination;
}

export async function updateDestination(id: string, updates: Partial<Destination>) {
  const { data, error } = await supabase
    .from('destinations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Destination;
}

export async function deleteDestination(id: string) {
  const { error } = await supabase
    .from('destinations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// PROVIDERS
// ============================================

export async function getProviders(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}) {
  let query = supabase
    .from('providers')
    .select('*', { count: 'exact' })
    .order('rating', { ascending: false });

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { providers: data as Provider[], total: count || 0 };
}

export async function getProviderById(id: string) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Provider;
}

export async function updateProviderStatus(id: string, status: Provider['status']) {
  const { data, error } = await supabase
    .from('providers')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Provider;
}

// ============================================
// BOOKINGS
// ============================================

export async function getBookings(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  providerId?: string;
}) {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      user:users(id, name, phone_number),
      trip:trips(
        id,
        departure_date,
        price,
        trip_type,
        destination:destinations(id, name, city, category),
        provider:providers(id, name)
      ),
      pickup_station:pickup_stations(id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.paymentStatus) {
    query = query.eq('payment_status', options.paymentStatus);
  }

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { bookings: data as unknown as BookingWithDetails[], total: count || 0 };
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      user:users(*),
      trip:trips(*, destination:destinations(*), provider:providers(*)),
      pickup_station:pickup_stations(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as BookingWithDetails;
}

export async function updateBookingStatus(
  id: string, 
  updates: { status?: Booking['status']; payment_status?: Booking['payment_status'] }
) {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function cancelBooking(id: string, refund: boolean = false) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: refund ? 'refunded' : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

// ============================================
// TRIPS
// ============================================

export async function getTrips(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  providerId?: string;
  destinationId?: string;
  category?: string;
  tourCategory?: string;
}) {
  let query = supabase
    .from('trips')
    .select(`
      *,
      destination:destinations(id, name, city, category, images),
      provider:providers(id, name, rating)
    `, { count: 'exact' })
    .order('departure_date', { ascending: true });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.providerId) {
    query = query.eq('provider_id', options.providerId);
  }

  if (options?.destinationId) {
    query = query.eq('destination_id', options.destinationId);
  }

  if (options?.category) {
    query = query.eq('destination.category', options.category);
  }

  if (options?.tourCategory) {
    query = query.eq('tour_category', options.tourCategory);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { trips: data as unknown as TripWithDetails[], total: count || 0 };
}

export async function getTripById(id: string) {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      destination:destinations(*),
      provider:providers(*),
      bookings(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as TripWithDetails;
}

// ============================================
// PAYMENT TRANSACTIONS
// ============================================

export async function getPaymentTransactions(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  paymentMethod?: string;
}) {
  let query = supabase
    .from('payment_transactions')
    .select(`
      *,
      booking:bookings(
        id,
        user:users(id, name, phone_number),
        trip:trips(destination:destinations(name))
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.paymentMethod) {
    query = query.eq('payment_method', options.paymentMethod);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { transactions: data as PaymentTransaction[], total: count || 0 };
}

// ============================================
// DRIVERS (for Provider Portal)
// ============================================

export async function getDriversByProvider(providerId: string) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('provider_id', providerId)
    .order('name');

  if (error) throw error;
  return data as Driver[];
}

export async function createDriver(driver: Omit<Driver, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('drivers')
    .insert(driver)
    .select()
    .single();

  if (error) throw error;
  return data as Driver;
}

export async function updateDriver(id: string, updates: Partial<Driver>) {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Driver;
}

// ============================================
// PICKUP STATIONS
// ============================================

export async function getPickupStations() {
  const { data, error } = await supabase
    .from('pickup_stations')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as PickupStation[];
}

// ============================================
// IN-APP NOTIFICATIONS
// ============================================

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string | null;
}

export async function getInAppNotifications(
  recipientType: 'admin' | 'provider',
  limit = 10
): Promise<InAppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at, action_url')
    .eq('recipient_type', recipientType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as InAppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}


