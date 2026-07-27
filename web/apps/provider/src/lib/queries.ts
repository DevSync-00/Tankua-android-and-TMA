import { supabase } from './supabase';

// ============================================
// PROVIDER DASHBOARD
// ============================================

export interface ProviderStats {
  todayBookings: number;
  monthlyEarnings: number;
  activeTrips: number;
  averageRating: number;
  bookingsChange: number;
  earningsChange: number;
}

export interface UpcomingTrip {
  id: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  capacity: number;
  driver: string;
  vehicle: string;
  status: string;
}

export interface RecentBooking {
  id: string;
  customer: string;
  destination: string;
  seats: number;
  amount: number;
  time: string;
  status: string;
}

export interface RecentReview {
  customer: string;
  rating: number;
  comment: string;
  trip: string;
  date: string;
}

export async function getProviderStats(providerId: string): Promise<ProviderStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fetch today's bookings and monthly earnings
  const [todayBookingsResult, monthlyEarningsResult, providerResult] = await Promise.all([
    // Today's bookings
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    
    // Monthly earnings
    supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfMonth.toISOString()),
    
    // Provider info for rating
    supabase
      .from('providers')
      .select('rating, total_trips')
      .eq('id', providerId)
      .single(),
  ]);

  const monthlyEarnings = monthlyEarningsResult.data?.reduce(
    (sum, b) => sum + (b.total_price || 0), 0
  ) || 0;

  // Get active trips count
  const { count: activeTrips } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .eq('status', 'upcoming');

  // Calculate bookings change (yesterday vs today)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const { count: yesterdayBookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString());

  const todayBookings = todayBookingsResult.count || 0;
  const yesterdayBookingsCount = yesterdayBookings || 0;
  const bookingsChange = yesterdayBookingsCount > 0 
    ? Math.round(((todayBookings - yesterdayBookingsCount) / yesterdayBookingsCount) * 100)
    : (todayBookings > 0 ? 100 : 0);

  // Calculate earnings change (last month vs this month)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const { data: lastMonthEarningsData } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .gte('created_at', lastMonthStart.toISOString())
    .lte('created_at', lastMonthEnd.toISOString());

  const lastMonthEarnings = lastMonthEarningsData?.reduce(
    (sum, b) => sum + (b.total_price || 0), 0
  ) || 0;
  const earningsChange = lastMonthEarnings > 0
    ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
    : (monthlyEarnings > 0 ? 100 : 0);

  return {
    todayBookings,
    monthlyEarnings,
    activeTrips: activeTrips || 0,
    averageRating: providerResult.data?.rating || 0,
    bookingsChange,
    earningsChange,
  };
}

export async function getUpcomingTrips(providerId: string, limit = 3): Promise<UpcomingTrip[]> {
  // Try with departure_date first, fallback to date
  let query = supabase
    .from('trips')
    .select(`
      id,
      departure_date,
      date,
      max_seats,
      available_seats,
      status,
      destinations (name)
    `)
    .eq('provider_id', providerId)
    .in('status', ['upcoming', 'active'])
    .limit(limit);

  // Try ordering by departure_date, fallback to date
  try {
    query = query.order('departure_date', { ascending: true });
  } catch {
    query = query.order('date', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    // If error is about missing column, try with date column
    if (error.message?.includes('departure_date') || error.code === '42703') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('trips')
        .select(`
          id,
          date,
          max_seats,
          available_seats,
          status,
          destinations (name)
        `)
        .eq('provider_id', providerId)
        .in('status', ['upcoming', 'active'])
        .order('date', { ascending: true })
        .limit(limit);
      
      if (fallbackError) {
        console.error('Error fetching upcoming trips:', fallbackError);
        return [];
      }
      
      return (fallbackData || []).map((trip: any) => {
        const maxSeats = trip.max_seats || 0;
        const tripDate = trip.date ? new Date(trip.date) : null;
        
        return {
          id: trip.id,
          destination: trip.destinations?.name || 'Unknown',
          date: tripDate ? tripDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) : 'TBD',
          time: tripDate ? tripDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }) : 'TBD',
          passengers: maxSeats - (trip.available_seats || 0),
          capacity: maxSeats,
          driver: 'Unassigned',
          vehicle: 'Vehicle',
          status: trip.status,
        };
      });
    }
    
    console.error('Error fetching upcoming trips:', error);
    return [];
  }

  return (data || []).map((trip: any) => {
    const tripDate = trip.departure_date || trip.date;
    const maxSeats = trip.max_seats || 0;
    const dateObj = tripDate ? new Date(tripDate) : null;
    
    return {
      id: trip.id,
      destination: trip.destinations?.name || 'Unknown',
      date: dateObj ? dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) : 'TBD',
      time: dateObj ? dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) : 'TBD',
      passengers: maxSeats - (trip.available_seats || 0),
      capacity: maxSeats,
      driver: trip.drivers?.name || 'Unassigned',
      vehicle: 'Vehicle', // TODO: Add vehicles table
      status: trip.status,
    };
  });
}

export async function getRecentBookings(providerId: string, limit = 4): Promise<RecentBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      seats,
      total_price,
      status,
      created_at,
      users (name),
      trips!inner (
        provider_id,
        destinations (name)
      )
    `)
    .eq('trips.provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent bookings:', error);
    return [];
  }

  return (data || []).map((booking: any) => {
    const now = new Date();
    const createdAt = new Date(booking.created_at);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    let timeAgo: string;
    if (diffMins < 60) {
      timeAgo = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else {
      timeAgo = `${Math.floor(diffHours / 24)}d ago`;
    }

    return {
      id: booking.id.substring(0, 8),
      customer: booking.users?.name || 'Unknown',
      destination: booking.trips?.destinations?.name || 'Unknown',
      seats: booking.seats,
      amount: booking.total_price,
      time: timeAgo,
      status: booking.status,
    };
  });
}

export async function getRecentReviews(providerId: string, limit = 3): Promise<RecentReview[]> {
  try {
    // Fetch reviews directly from reviews table
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        users (name),
        bookings (
          trips (
            destinations (name)
          )
        )
      `)
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent reviews:', error);
      return [];
    }

    return (data || []).map((review: any) => {
      const now = new Date();
      const reviewDate = new Date(review.created_at);
      const diffMs = now.getTime() - reviewDate.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      let dateStr: string;
      if (diffDays === 0) {
        dateStr = 'today';
      } else if (diffDays === 1) {
        dateStr = '1 day ago';
      } else {
        dateStr = `${diffDays} days ago`;
      }

      const customerName = review.users?.name || 'Anonymous';
      const initials = customerName.split(' ').map((n: string) => n[0]).join('') + '.';

      return {
        customer: initials,
        rating: review.rating || 5,
        comment: review.comment || 'No comment',
        trip: review.bookings?.trips?.destinations?.name || 'Unknown',
        date: dateStr,
      };
    });
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    return [];
  }
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
    destination: { id: string; name: string } | null;
  } | null;
  pickup_station: { name: string } | null;
  destination_id: string | null;
  destination_name: string | null;
  seats: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export async function getProviderBookings(
  providerId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
): Promise<{ bookings: BookingDetails[]; total: number }> {
  // Query bookings by provider_id directly (bookings have provider_id column)
  // Use left join for trips so bookings without trips still show
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
      destination_id,
      destination_name,
      provider_id,
      users (id, name, phone_number),
      trips (
        id,
        departure_date,
        provider_id,
        destinations (id, name)
      )
    `, { count: 'exact' })
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

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

  if (error) {
    console.error('Error fetching provider bookings:', error);
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
      } : null,
      pickup_station: b.pickup_station, // JSONB column, not a foreign key
      destination_id: b.destination_id,
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
  bookingId: string,
  updates: { status?: string; payment_status?: string }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// TRIPS MANAGEMENT
// ============================================

export interface TripDetails {
  id: string;
  destination_id: string | null;
  destination: { id: string; name: string; city?: string; region?: string } | null;
  departure_date: string;
  return_date: string | null;
  trip_type: string;
  price: number;
  max_seats: number;
  available_seats: number;
  status: string;
  bookings_count: number;
  tour_category?: string | null;
  itinerary?: string | null;
}

export async function getProviderTrips(
  providerId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
): Promise<{ trips: TripDetails[]; total: number }> {
  let query = supabase
    .from('trips')
    .select(`
      id,
      destination_id,
      departure_date,
      date,
      return_date,
      trip_type,
      price,
      max_seats,
      available_seats,
      status,
      tour_category,
      itinerary,
      destinations (id, name, city, region)
    `, { count: 'exact' })
    .eq('provider_id', providerId);
  
  // Try ordering by departure_date, fallback to date
  try {
    query = query.order('departure_date', { ascending: false });
  } catch {
    query = query.order('date', { ascending: false });
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

  if (error) {
    console.error('Error fetching provider trips:', error);
    return { trips: [], total: 0 };
  }

  return {
    trips: (data || []).map((t: any) => ({
      id: t.id,
      destination_id: t.destination_id || t.destinations?.id || null,
      destination: t.destinations || null,
      departure_date: t.departure_date || t.date,
      return_date: t.return_date,
      trip_type: t.trip_type,
      price: t.price,
      max_seats: t.max_seats || 0,
      available_seats: t.available_seats || 0,
      status: t.status,
      tour_category: t.tour_category,
      itinerary: t.itinerary,
      bookings_count: (t.max_seats || 0) - (t.available_seats || 0),
    })),
    total: count || 0,
  };
}

export async function createTrip(trip: {
  provider_id: string;
  destination_id?: string;
  trip_type: string;
  departure_date: string;
  return_date?: string;
  price: number;
  max_seats: number;
  tour_category?: string;
  itinerary?: string;
  pickup_stations?: Array<{ station_id: string; pickup_time: string; extra_price: number }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  // Prepare trip data - handle both departure_date and date columns
  const tripData: any = {
    provider_id: trip.provider_id,
    destination_id: trip.destination_id,
    trip_type: trip.trip_type,
    price: trip.price,
    max_seats: trip.max_seats,
    available_seats: trip.max_seats,
    status: 'upcoming',
  };

  if (trip.tour_category) {
    tripData.tour_category = trip.tour_category;
  }

  if (trip.itinerary) {
    tripData.itinerary = trip.itinerary;
  }
  
  // Set departure_date and also set date for backward compatibility
  tripData.departure_date = trip.departure_date;
  // Extract date part from departure_date for the date column (backward compatibility)
  tripData.date = trip.departure_date.split('T')[0];
  
  if (trip.return_date) {
    tripData.return_date = trip.return_date;
  }
  
  const { data, error } = await supabase
    .from('trips')
    .insert(tripData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating trip:', error);
    return { success: false, error: error.message };
  }

  if (trip.pickup_stations?.length) {
    const { error: stationsError } = await supabase
      .from('trip_pickup_stations')
      .insert(trip.pickup_stations.map((station) => ({
        trip_id: data.id,
        station_id: station.station_id,
        pickup_time: station.pickup_time,
        extra_price: station.extra_price,
      })));

    if (stationsError) {
      await supabase.from('trips').delete().eq('id', data.id);
      return { success: false, error: `Trip was not created: ${stationsError.message}` };
    }
  }

  return { success: true, id: data.id };
}

export async function getProviderTrip(providerId: string, tripId: string) {
  const [{ data: trip, error }, { data: stations, error: stationsError }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).eq('provider_id', providerId).single(),
    supabase.from('trip_pickup_stations')
      .select('station_id, pickup_time, extra_price, pickup_stations(id, name, city, address)')
      .eq('trip_id', tripId),
  ]);

  if (error) return { trip: null, stations: [], error: error.message };
  if (stationsError) return { trip: null, stations: [], error: stationsError.message };
  return { trip, stations: stations || [], error: null };
}

export async function replaceTripPickupStations(
  tripId: string,
  stations: Array<{ station_id: string; pickup_time: string; extra_price: number }>
): Promise<{ success: boolean; error?: string }> {
  const { error: deleteError } = await supabase
    .from('trip_pickup_stations')
    .delete()
    .eq('trip_id', tripId);
  if (deleteError) return { success: false, error: deleteError.message };
  if (!stations.length) return { success: true };

  const { error } = await supabase.from('trip_pickup_stations').insert(
    stations.map((station) => ({ trip_id: tripId, ...station }))
  );
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateTrip(
  tripId: string,
  updates: {
    destination_id?: string;
    trip_type?: string;
    departure_date?: string;
    return_date?: string | null;
    price?: number;
    max_seats?: number;
    available_seats?: number;
    status?: string;
    tour_category?: string;
    itinerary?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const updateData: any = { ...updates };
  
  // Handle departure_date and date column
  if (updates.departure_date) {
    updateData.departure_date = updates.departure_date;
    updateData.date = updates.departure_date.split('T')[0];
  }
  
  // If max_seats is updated, adjust available_seats if needed
  if (updates.max_seats !== undefined && updates.available_seats === undefined) {
    // Get current trip to calculate available_seats adjustment
    const { data: currentTrip } = await supabase
      .from('trips')
      .select('max_seats, available_seats')
      .eq('id', tripId)
      .single();
    
    if (currentTrip) {
      const seatsDiff = updates.max_seats - currentTrip.max_seats;
      updateData.available_seats = Math.max(0, currentTrip.available_seats + seatsDiff);
    }
  }
  
  const { error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId);
  
  if (error) {
    console.error('Error updating trip:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function deleteTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
  // Check if trip has bookings
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('trip_id', tripId)
    .limit(1);
  
  if (bookingsError) {
    console.error('Error checking bookings:', bookingsError);
    return { success: false, error: 'Failed to check trip bookings' };
  }
  
  if (bookings && bookings.length > 0) {
    return { success: false, error: 'Cannot delete trip with existing bookings' };
  }
  
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);
  
  if (error) {
    console.error('Error deleting trip:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

export async function updateTripStatus(
  tripId: string,
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('trips')
    .update({ status })
    .eq('id', tripId);
  
  if (error) {
    console.error('Error updating trip status:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// ============================================
// DRIVERS MANAGEMENT
// ============================================

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  license_number: string | null;
  avatar_url: string | null;
  rating: number;
  status: 'available' | 'on_trip' | 'offline';
  created_at: string;
}

export async function getDrivers(providerId: string): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('provider_id', providerId)
    .order('name');

  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }

  return data as Driver[];
}

export async function createDriver(driver: {
  provider_id: string;
  name: string;
  phone?: string;
  license_number?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      ...driver,
      rating: 5.0,
      status: 'available',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating driver:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateDriver(
  id: string,
  updates: {
    name?: string;
    phone?: string;
    license_number?: string;
    status?: 'available' | 'on_trip' | 'offline';
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating driver:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteDriver(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting driver:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateDriverStatus(
  id: string,
  status: 'available' | 'on_trip' | 'offline'
): Promise<boolean> {
  const { error } = await supabase
    .from('drivers')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating driver status:', error);
    return false;
  }

  return true;
}

// ============================================
// EARNINGS
// ============================================

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  lastPayout: number;
  lastPayoutDate: string | null;
  monthlyData: { month: string; earnings: number }[];
}

export async function getEarningsSummary(providerId: string): Promise<EarningsSummary> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get all paid bookings for this provider
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('total_price, created_at, payment_status')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid');

  // Get bookings from last 6 months for chart
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('total_price, created_at')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .gte('created_at', sixMonthsAgo.toISOString());

  // Get this month's earnings
  const { data: thisMonthBookings } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .gte('created_at', firstDayOfMonth.toISOString());

  // Get pending bookings (paid but not yet completed)
  const { data: pendingBookings } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .in('status', ['pending', 'confirmed']);

  // Get last payout (most recent completed booking older than 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { data: lastPayoutBooking } = await supabase
    .from('bookings')
    .select('total_price, created_at')
    .eq('provider_id', providerId)
    .eq('payment_status', 'paid')
    .eq('status', 'completed')
    .lt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const totalEarnings = allBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
  const thisMonthEarnings = thisMonthBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
  const pendingPayout = pendingBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
  const lastPayout = lastPayoutBooking?.total_price || 0;
  const lastPayoutDate = lastPayoutBooking?.created_at || null;

  // Group by month
  const monthlyData: { [key: string]: number } = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = months[d.getMonth()];
    monthlyData[key] = 0;
  }

  recentBookings?.forEach((b: any) => {
    const d = new Date(b.created_at);
    const key = months[d.getMonth()];
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += b.total_price || 0;
    }
  });

  return {
    totalEarnings,
    pendingPayout,
    lastPayout,
    lastPayoutDate,
    monthlyData: Object.entries(monthlyData).map(([month, earnings]) => ({
      month,
      earnings,
    })),
  };
}


