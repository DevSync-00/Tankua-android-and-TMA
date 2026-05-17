import { supabase } from './supabase';

// ============================================
// DASHBOARD STATISTICS
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  activeTrips: number;
  totalProviders: number;
  totalRevenue: number;
  usersChange: number;
  bookingsChange: number;
  tripsChange: number;
  providersChange: number;
}

export interface RecentBooking {
  id: string;
  user: { name: string; phone_number: string } | null;
  destination: string;
  provider: string;
  amount: number;
  status: string;
  date: string;
}

export interface TopProvider {
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export interface TopDestination {
  name: string;
  bookings: number;
  region: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch current period stats
  const [
    usersResult,
    bookingsResult,
    tripsResult,
    providersResult,
    revenueResult,
    // Previous period for comparison
    prevUsersResult,
    prevBookingsResult,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
    supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('total_price').eq('payment_status', 'paid'),
    // Previous 30 days users
    supabase.from('users').select('id', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString()),
    // Previous 30 days bookings
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .lt('created_at', thirtyDaysAgo.toISOString()),
  ]);

  const totalUsers = usersResult.count || 0;
  const totalBookings = bookingsResult.count || 0;
  const activeTrips = tripsResult.count || 0;
  const totalProviders = providersResult.count || 0;
  const totalRevenue = revenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

  const prevUsers = prevUsersResult.count || 0;
  const prevBookings = prevBookingsResult.count || 0;

  // Calculate percentage changes
  const newUsers = totalUsers - prevUsers;
  const usersChange = prevUsers > 0 ? Math.round((newUsers / prevUsers) * 100) : 0;
  
  const newBookings = totalBookings - prevBookings;
  const bookingsChange = prevBookings > 0 ? Math.round((newBookings / prevBookings) * 100) : 0;

  // Calculate trips change (previous 30 days vs current 30 days)
  const prevTripsResult = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'upcoming')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());
  
  const prevTrips = prevTripsResult.count || 0;
  const tripsChange = prevTrips > 0 ? Math.round(((activeTrips - prevTrips) / prevTrips) * 100) : (activeTrips > 0 ? 100 : 0);

  // Calculate providers change (previous 30 days vs current 30 days)
  const prevProvidersResult = await supabase
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());
  
  const prevProviders = prevProvidersResult.count || 0;
  const providersChange = prevProviders > 0 ? Math.round(((totalProviders - prevProviders) / prevProviders) * 100) : (totalProviders > 0 ? 100 : 0);

  return {
    totalUsers,
    totalBookings,
    activeTrips,
    totalProviders,
    totalRevenue,
    usersChange,
    bookingsChange,
    tripsChange,
    providersChange,
  };
}

export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  revenueByStatus: { status: string; revenue: number }[];
}

export async function getBookingTrends(days: number = 30): Promise<BookingTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('bookings')
    .select('created_at, total_price, payment_status')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching booking trends:', error);
    return [];
  }

  // Group by date
  const trendsMap = new Map<string, { bookings: number; revenue: number }>();
  
  (data || []).forEach((booking: any) => {
    const date = new Date(booking.created_at).toISOString().split('T')[0];
    const existing = trendsMap.get(date) || { bookings: 0, revenue: 0 };
    trendsMap.set(date, {
      bookings: existing.bookings + 1,
      revenue: existing.revenue + (booking.payment_status === 'paid' ? (booking.total_price || 0) : 0),
    });
  });

  // Fill in missing dates
  const trends: BookingTrend[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();
  
  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = trendsMap.get(dateStr) || { bookings: 0, revenue: 0 };
    trends.push({
      date: dateStr,
      bookings: data.bookings,
      revenue: data.revenue,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
}

export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    allBookings,
    monthlyBookings,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('total_price, payment_status, status')
      .eq('payment_status', 'paid'),
    supabase
      .from('bookings')
      .select('total_price, payment_status')
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfMonth.toISOString()),
  ]);

  const totalRevenue = allBookings.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
  const monthlyRevenue = monthlyBookings.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
  const totalBookings = allBookings.data?.length || 0;
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Revenue by status
  const revenueByStatusMap = new Map<string, number>();
  allBookings.data?.forEach((booking: any) => {
    const status = booking.status || 'unknown';
    const existing = revenueByStatusMap.get(status) || 0;
    revenueByStatusMap.set(status, existing + (booking.total_price || 0));
  });

  const revenueByStatus = Array.from(revenueByStatusMap.entries()).map(([status, revenue]) => ({
    status,
    revenue,
  }));

  return {
    totalRevenue,
    monthlyRevenue,
    averageBookingValue,
    revenueByStatus,
  };
}

export async function getRecentBookings(limit = 5): Promise<RecentBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      total_price,
      status,
      created_at,
      users (name, phone_number),
      trips (
        destinations (name),
        providers (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent bookings:', error);
    return [];
  }

  return (data || []).map((booking: any) => ({
    id: booking.id,
    user: booking.users,
    destination: booking.trips?.destinations?.name || booking.destination_name || 'Unknown',
    provider: booking.trips?.providers?.name || 'Unknown',
    amount: booking.total_price || 0,
    status: booking.status,
    date: booking.created_at,
  }));
}

export async function getTopProviders(limit = 4): Promise<TopProvider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('id, name, rating, total_trips')
    .eq('status', 'active')
    .order('total_trips', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }

  // For each provider, get their booking stats
  const providersWithStats = await Promise.all(
    (data || []).map(async (provider: any) => {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('payment_status', 'paid')
        .eq('trip_id', provider.id); // This needs proper join through trips

      return {
        name: provider.name,
        bookings: provider.total_trips || 0,
        revenue: bookings?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0,
        rating: provider.rating || 0,
      };
    })
  );

  return providersWithStats;
}

export async function getTopDestinations(limit = 4): Promise<TopDestination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('id, name, region')
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  if (error) {
    console.error('Error fetching top destinations:', error);
    return [];
  }

  const destinationsWithStats = await Promise.all(
    (data || []).map(async (destination: { id: string; name: string; region: string | null }) => {
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('destination_id', destination.id);

      return {
        name: destination.name,
        region: destination.region || 'Unknown',
        bookings: count || 0,
      };
    })
  );

  return destinationsWithStats.sort((a, b) => b.bookings - a.bookings).slice(0, limit);
}

// ============================================
// USERS MANAGEMENT
// ============================================

export interface User {
  id: string;
  phone_number: string;
  name: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}

export async function getUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{ users: User[]; total: number }> {
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,phone_number.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching users:', error);
    return { users: [], total: 0 };
  }
  
  return { users: data as User[], total: count || 0 };
}

export async function updateUser(
  id: string,
  updates: {
    name?: string;
    email?: string;
    phone_number?: string;
    is_admin?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating user:', error);
    return false;
  }

  return true;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }

  return true;
}

// ============================================
// BOOKINGS MANAGEMENT
// ============================================

export interface BookingDetails {
  id: string;
  user: { id: string; name: string; phone_number: string } | null;
  trip: {
    id: string;
    departure_date: string;
    destination: { id: string; name: string; city: string } | null;
    provider: { id: string; name: string } | null;
  } | null;
  pickup_station: any; // JSONB column - can be { name, ... } or null
  destination_name: string | null;
  seats: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export async function getBookings(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  paymentStatus?: string;
}): Promise<{ bookings: BookingDetails[]; total: number }> {
  let query = supabase
    .from('bookings')
    .select(`
      id,
      seats,
      total_price,
      status,
      payment_status,
      created_at,
      pickup_station,
      destination_name,
      provider_id,
      users (id, name, phone_number),
      trips (
        id,
        departure_date,
        destinations (id, name, city),
        providers (id, name)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.paymentStatus) {
    query = query.eq('payment_status', options.paymentStatus);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], total: 0 };
  }
  
  return {
    bookings: (data || []).map((b: any) => ({
      id: b.id,
      user: b.users,
      trip: b.trips ? {
        id: b.trips.id,
        departure_date: b.trips.departure_date,
        destination: b.trips.destinations,
        provider: b.trips.providers,
      } : null,
      pickup_station: b.pickup_station, // JSONB column, not a foreign key
      destination_name: b.destination_name,
      seats: b.seats,
      total_price: b.total_price,
      status: b.status,
      payment_status: b.payment_status,
      created_at: b.created_at,
    })),
    total: count || 0,
  };
}

export async function updateBookingStatus(
  id: string,
  updates: { status?: string; payment_status?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating booking:', error);
    return false;
  }
  
  return true;
}

// ============================================
// PROVIDERS MANAGEMENT
// ============================================

export interface Provider {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  rating: number;
  total_trips: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export async function getProviders(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
}): Promise<{ providers: Provider[]; total: number }> {
  let query = supabase
    .from('providers')
    .select('*', { count: 'exact' })
    .order('rating', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching providers:', error);
    return { providers: [], total: 0 };
  }
  
  return { providers: data as Provider[], total: count || 0 };
}

export async function updateProviderStatus(
  id: string,
  status: 'active' | 'inactive' | 'suspended'
): Promise<boolean> {
  const { error } = await supabase
    .from('providers')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating provider:', error);
    return false;
  }
  
  return true;
}

export async function updateProvider(
  id: string,
  updates: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    status?: 'active' | 'inactive' | 'suspended';
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('providers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating provider:', error);
    return false;
  }

  return true;
}

export async function createProvider(provider: {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('providers')
      .insert({
        name: provider.name,
        description: provider.description || null,
        phone: provider.phone || null,
        email: provider.email || null,
        logo_url: provider.logo_url || null,
        status: provider.status || 'inactive',
        rating: 0,
        total_trips: 0,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create provider' };
  }
}

export async function createDestination(destination: {
  name: string;
  description?: string;
  region?: string;
  city?: string;
  distance?: number;
  images?: string[];
  tags?: string[];
  location?: any;
  category?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Try destinations table first
    let { data, error } = await supabase
      .from('destinations')
      .insert({
        name: destination.name,
        description: destination.description || null,
        region: destination.region || null,
        city: destination.city || null,
        distance: destination.distance || null,
        images: destination.images || [],
        tags: destination.tags || [],
        location: destination.location || null,
        category: destination.category || 'other',
      })
      .select('id')
      .single();

    // No fallback - destinations table should exist

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data returned' };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create destination' };
  }
}

export async function updateDestination(
  id: string,
  updates: {
    name?: string;
    description?: string;
    region?: string;
    city?: string;
    distance?: number;
    images?: string[];
    tags?: string[];
    location?: any;
    category?: string;
  }
): Promise<boolean> {
  try {
    // Try destinations table first
    let { error } = await supabase
      .from('destinations')
      .update(updates)
      .eq('id', id);

    // No fallback - destinations table should exist

    if (error) {
      console.error('Error updating destination:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Error updating destination:', err);
    return false;
  }
}

export async function deleteDestination(id: string): Promise<boolean> {
  const { error } = await supabase.from('destinations').delete().eq('id', id);
  if (error) {
    console.error('Error deleting destination:', error);
    return false;
  }
  return true;
}

// ============================================
// SUPPORT TICKETS MANAGEMENT
// ============================================

export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  provider_id: string | null;
  provider: Provider | null;
  user_id: string | null;
  booking_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSupportTickets(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  category?: string;
  provider_id?: string;
}): Promise<{ tickets: SupportTicket[]; total: number }> {
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      providers (
        id,
        name,
        email,
        phone,
        status
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.provider_id) {
    query = query.eq('provider_id', options.provider_id);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching support tickets:', error);
    return { tickets: [], total: 0 };
  }

  return {
    tickets: (data || []).map((t: any) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      provider_id: t.provider_id,
      provider: t.providers,
      user_id: t.user_id,
      booking_id: t.booking_id,
      assigned_to: t.assigned_to,
      created_at: t.created_at,
      updated_at: t.updated_at,
    })),
    total: count || 0,
  };
}

export async function getProviderApplications(): Promise<{ applications: SupportTicket[]; total: number }> {
  try {
    // First, check if support_tickets table exists by trying to query it
    // Get support tickets that are provider registrations
    // These have provider_id and subject contains "registration" or "New provider"
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        providers (
          id,
          name,
          email,
          phone,
          status
        )
      `, { count: 'exact' })
      .not('provider_id', 'is', null)
      .or('subject.ilike.%registration%,subject.ilike.%New provider%')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    // If table doesn't exist or query fails, return empty array
    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('support_tickets table does not exist. Please run database migrations.');
        return { applications: [], total: 0 };
      }
      console.error('Error fetching provider applications:', error);
      return { applications: [], total: 0 };
    }

    const applications = (data || []).map((t: any) => ({
      id: t.id,
      ticket_number: t.ticket_number || 'N/A',
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      provider_id: t.provider_id,
      provider: t.providers,
      user_id: t.user_id,
      booking_id: t.booking_id,
      assigned_to: t.assigned_to,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return {
      applications,
      total: count || 0,
    };
  } catch (err: any) {
    console.error('Error in getProviderApplications:', err);
    return { applications: [], total: 0 };
  }
}

export async function updateSupportTicket(
  id: string,
  updates: {
    status?: string;
    priority?: string;
    assigned_to?: string | null;
    resolution_notes?: string;
  }
): Promise<boolean> {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'resolved' || updates.status === 'closed') {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('support_tickets')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating support ticket:', error);
    return false;
  }

  return true;
}

export async function createTicketMessage(
  ticketId: string,
  message: {
    message: string;
    sender_type: 'user' | 'provider' | 'admin' | 'system';
    sender_id?: string;
    attachments?: string[];
    is_internal?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      ...message,
    });

  if (error) {
    console.error('Error creating ticket message:', error);
    return false;
  }

  // Update ticket updated_at
  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return true;
}

// ============================================
// PROMOTIONS MANAGEMENT
// ============================================

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_booking_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  applicable_destinations: string[] | null;
  applicable_providers: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPromotions(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  is_active?: boolean;
}): Promise<{ promotions: Promotion[]; total: number }> {
  let query = supabase
    .from('promotions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%`);
  }

  if (options?.is_active !== undefined) {
    query = query.eq('is_active', options.is_active);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching promotions:', error);
    return { promotions: [], total: 0 };
  }

  return { promotions: data as Promotion[], total: count || 0 };
}

export async function createPromotion(promotion: {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_booking_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  valid_from: string;
  valid_until: string;
  applicable_destinations?: string[];
  applicable_providers?: string[];
  is_active?: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Get current admin user ID
    const adminData = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
    const adminUser = adminData ? JSON.parse(adminData) : null;

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        code: promotion.code,
        name: promotion.name,
        description: promotion.description || null,
        discount_type: promotion.discount_type,
        discount_value: promotion.discount_value,
        min_booking_amount: promotion.min_booking_amount || 0,
        max_discount: promotion.max_discount || null,
        usage_limit: promotion.usage_limit || null,
        per_user_limit: promotion.per_user_limit || 1,
        valid_from: promotion.valid_from,
        valid_until: promotion.valid_until,
        applicable_destinations: promotion.applicable_destinations || null,
        applicable_providers: promotion.applicable_providers || null,
        is_active: promotion.is_active !== undefined ? promotion.is_active : true,
        created_by: adminUser?.id || null,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create promotion' };
  }
}

export async function updatePromotion(
  id: string,
  updates: {
    name?: string;
    description?: string;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    min_booking_amount?: number;
    max_discount?: number;
    usage_limit?: number;
    per_user_limit?: number;
    valid_from?: string;
    valid_until?: string;
    applicable_destinations?: string[];
    applicable_providers?: string[];
    is_active?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('promotions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating promotion:', error);
    return false;
  }

  return true;
}

export async function deletePromotion(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    return false;
  }

  return true;
}

// ============================================
// ADMIN USERS MANAGEMENT
// ============================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support' | 'finance';
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAdminUsers(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
}): Promise<{ admins: AdminUser[]; total: number }> {
  let query = supabase
    .from('admin_users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  }

  if (options?.role) {
    query = query.eq('role', options.role);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching admin users:', error);
    return { admins: [], total: 0 };
  }

  return { admins: data as AdminUser[], total: count || 0 };
}

export async function createAdminUser(admin: {
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'support' | 'finance';
  phone?: string;
  password: string;
}): Promise<{ success: boolean; id?: string; error?: string; authWarning?: string }> {
  try {
    // Step 1: Create user in Supabase Auth
    // Note: This requires admin API. If it fails, user must be created manually in Auth dashboard
    const { supabase: adminSupabase } = await import('@/lib/supabase');
    
    let authWarning: string | undefined;
    let authUserId: string | undefined;

    try {
      // Try to create auth user using admin API
      // This will only work if we have service role key configured
      // Check if admin API is available
      if (adminSupabase.auth && (adminSupabase.auth as any).admin) {
        const { data: authData, error: authError } = await (adminSupabase.auth as any).admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
        });

        if (authError) {
          if (authError.message?.includes('already registered')) {
            // User already exists in Auth - that's okay
            authWarning = 'User already exists in Auth. Using existing account.';
          } else {
            // Can't create auth user - need manual creation
            authWarning = `Could not create Auth user automatically: ${authError.message}. Please create user in Supabase Auth dashboard first.`;
          }
        } else if (authData?.user) {
          authUserId = authData.user.id;
        }
      } else {
        // Admin API not available - user must create manually
        authWarning = 'Auth user creation requires service role key. Please create user in Supabase Auth dashboard first.';
      }
    } catch (authErr: any) {
      // Admin API not available - user must create manually
      authWarning = 'Auth user creation requires service role key. Please create user in Supabase Auth dashboard first.';
    }

    // Step 2: Create admin_users entry
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: admin.email,
        name: admin.name,
        role: admin.role,
        phone: admin.phone || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      // If admin_users insert fails but auth was created, clean up
      if (authUserId && adminSupabase.auth && (adminSupabase.auth as any).admin) {
        try {
          await (adminSupabase.auth as any).admin.deleteUser(authUserId);
        } catch {}
      }
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id, authWarning };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create admin user' };
  }
}

export async function updateAdminUser(
  id: string,
  updates: {
    name?: string;
    role?: 'super_admin' | 'admin' | 'support' | 'finance';
    phone?: string;
    is_active?: boolean;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('admin_users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating admin user:', error);
    return false;
  }

  return true;
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  // Don't actually delete - deactivate instead
  const { error } = await supabase
    .from('admin_users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deactivating admin user:', error);
    return false;
  }

  return true;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase: authSupabase } = await import('@/lib/supabase');
    
    // Get current user
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user || !user.email) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await authSupabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await authSupabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to change password' };
  }
}

export async function updateAdminPassword(
  adminEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update password via admin API
    // Note: This requires service role key. In production, use API route
    const { supabase: adminSupabase } = await import('@/lib/supabase');
    
    // Check if admin API is available
    if (!adminSupabase.auth || !(adminSupabase.auth as any).admin) {
      return { success: false, error: 'Password update requires service role key. Please use Supabase Auth dashboard or contact system administrator.' };
    }

    // Get user by email from auth
    const { data: { users }, error: usersError } = await (adminSupabase.auth as any).admin.listUsers();
    
    if (usersError) {
      return { success: false, error: usersError.message || 'Failed to list users' };
    }

    const authUser = users?.find((u: any) => u.email === adminEmail);

    if (!authUser) {
      return { success: false, error: 'Auth user not found. Please create user in Supabase Auth first.' };
    }

    const { error: updateError } = await (adminSupabase.auth as any).admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update password. Service role key may be required.' };
  }
}


