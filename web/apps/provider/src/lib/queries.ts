import { supabase } from './supabase';
import { getTripDateParts } from './trip-schedule';
import { getTripCurrency, sumByCurrency, type CurrencyTotals, type TripCurrency } from '@tankua/ui';

// ============================================
// PROVIDER DASHBOARD
// ============================================

export interface ProviderStats {
  todayBookings: number | null;
  monthlyEarnings: CurrencyTotals | null;
  activeTrips: number | null;
  averageRating: number | null;
  bookingsChange: number | undefined;
  earningsChange: number | undefined;
}

export interface UpcomingTrip {
  id: string;
  destination: string;
  departureDate: string;
  passengers: number;
  capacity: number;
  status: string;
  minimumInterest: number | null;
  interestCount: number;
}

export interface RecentBooking {
  id: string;
  customer: string;
  destination: string;
  seats: number;
  amount: number;
  currency: TripCurrency;
  time: string;
  status: string;
  paymentStatus: string | null;
  tripStatus: string | null;
  departureDate: string | null;
}

export interface RecentReview {
  id: string;
  customer: string;
  rating: number | null;
  comment: string;
  trip: string;
  date: string;
}

export async function getProviderStats(providerId: string): Promise<ProviderStats> {
  const now = new Date();
  const { date } = getTripDateParts(now.toISOString());
  const today = new Date(`${date}T00:00:00+03:00`);
  const yesterday = new Date(today.getTime() - 86_400_000);
  const [year, month] = date.split('-').map(Number);
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1, -3));
  const lastMonthStart = new Date(Date.UTC(year, month - 2, 1, -3));

  const [
    { count: todayBookings },
    { count: yesterdayBookings },
    { data: monthlyEarningsData },
    { data: lastMonthEarningsData },
    { count: activeTrips },
    { data: provider },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .gte('created_at', today.toISOString()),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString()),
    supabase
      .from('bookings')
      .select('base_price, total_price, currency')
      .eq('provider_id', providerId)
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfMonth.toISOString()),
    supabase
      .from('bookings')
      .select('base_price, total_price, currency')
      .eq('provider_id', providerId)
      .eq('payment_status', 'paid')
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', firstDayOfMonth.toISOString()),
    supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerId)
      .eq('status', 'active')
      .gt('departure_date', now.toISOString()),
    supabase
      .from('providers')
      .select('rating')
      .eq('id', providerId)
      .single(),
  ]);

  const monthlyEarnings = monthlyEarningsData && sumByCurrency(monthlyEarningsData, (booking) => Number(booking.base_price ?? booking.total_price));
  const lastMonthEarnings = lastMonthEarningsData && sumByCurrency(lastMonthEarningsData, (booking) => Number(booking.base_price ?? booking.total_price));
  const earningsCurrencies = Object.keys({ ...lastMonthEarnings, ...monthlyEarnings }) as TripCurrency[];
  const comparisonCurrency = earningsCurrencies.length === 1 ? earningsCurrencies[0] : undefined;
  const previousEarnings = comparisonCurrency ? lastMonthEarnings?.[comparisonCurrency] ?? 0 : 0;
  const bookingsChange = todayBookings !== null && yesterdayBookings !== null && yesterdayBookings > 0
    ? Math.round(((todayBookings - yesterdayBookings) / yesterdayBookings) * 100)
    : undefined;
  const earningsChange = comparisonCurrency && monthlyEarnings !== null && previousEarnings > 0
    ? Math.round(((monthlyEarnings[comparisonCurrency] ?? 0) - previousEarnings) / previousEarnings * 100)
    : undefined;
  const rating = Number(provider?.rating);

  return {
    todayBookings,
    monthlyEarnings,
    activeTrips,
    averageRating: rating >= 1 && rating <= 5 ? rating : null,
    bookingsChange,
    earningsChange,
  };
}

export async function getUpcomingTrips(providerId: string, limit = 3): Promise<UpcomingTrip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      id,
      departure_date,
      max_seats,
      available_seats,
      status,
      minimum_interest,
      interest_count,
      destinations (name)
    `)
    .eq('provider_id', providerId)
    .in('status', ['upcoming', 'active', 'collecting_interest'])
    .gt('departure_date', new Date().toISOString())
    .order('departure_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((trip) => {
    const capacity = trip.max_seats ?? 0;
    const passengers = Math.min(capacity, Math.max(0, capacity - (trip.available_seats ?? capacity)));
    const destination = Array.isArray(trip.destinations) ? trip.destinations[0] : trip.destinations;
    return {
      id: trip.id,
      destination: destination?.name || 'Unknown destination',
      departureDate: trip.departure_date,
      passengers,
      capacity,
      status: trip.status,
      minimumInterest: trip.minimum_interest,
      interestCount: trip.interest_count ?? 0,
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
      currency,
      status,
      payment_status,
      created_at,
      destination_name,
      users (name),
      trips (
        status,
        departure_date,
        destinations (name)
      )
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);

  if (error) throw error;

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
      id: booking.id,
      customer: booking.users?.name || 'Unknown',
      destination: booking.trips?.destinations?.name || booking.destination_name || 'Unknown destination',
      seats: booking.seats,
      amount: booking.total_price,
      currency: getTripCurrency(booking.currency),
      time: timeAgo,
      status: booking.status,
      paymentStatus: booking.payment_status,
      tripStatus: booking.trips?.status ?? null,
      departureDate: booking.trips?.departure_date ?? null,
    };
  });
}

export async function getRecentReviews(providerId: string, limit = 3): Promise<RecentReview[]> {
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

  if (error) throw error;

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
    const rating = Number(review.rating);

    return {
      id: review.id,
      customer: initials,
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      comment: review.comment || 'No comment',
      trip: review.bookings?.trips?.destinations?.name || 'Unknown',
      date: dateStr,
    };
  });
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
    status: string;
    destination: { id: string; name: string } | null;
  } | null;
  pickup_station: { name: string } | null;
  destination_id: string | null;
  destination_name: string | null;
  seats: number;
  base_price: number | null;
  total_price: number;
  currency: TripCurrency;
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
    currency?: TripCurrency;
  }
): Promise<{ bookings: BookingDetails[]; total: number }> {
  // Query bookings by provider_id directly (bookings have provider_id column)
  // Use left join for trips so bookings without trips still show
  let query = supabase
    .from('bookings')
    .select(`
      id,
      seats,
      base_price,
      total_price,
      currency,
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
        status,
        provider_id,
        destinations (id, name)
      )
    `, { count: 'exact' })
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.currency) {
    query = query.eq('currency', options.currency);
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
        status: b.trips.status,
        destination: b.trips.destinations,
      } : null,
      pickup_station: b.pickup_station, // JSONB column, not a foreign key
      destination_id: b.destination_id,
      destination_name: b.destination_name,
      seats: b.seats,
      base_price: b.base_price,
      total_price: b.total_price,
      currency: getTripCurrency(b.currency),
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
  currency: TripCurrency;
  max_seats: number;
  available_seats: number;
  status: string;
  minimum_interest: number | null;
  interest_count: number;
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
    .select('*, destinations (id, name, city, region)', { count: 'exact' })
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
      currency: getTripCurrency(t.currency),
      max_seats: t.max_seats || 0,
      available_seats: t.available_seats || 0,
      status: t.status,
      minimum_interest: t.minimum_interest ?? null,
      interest_count: t.interest_count ?? 0,
      tour_category: t.tour_category,
      itinerary: t.itinerary,
      bookings_count: (t.max_seats || 0) - (t.available_seats || 0),
    })),
    total: count || 0,
  };
}

const MAX_TRIP_INTEGER = 2_147_483_647;
const PICKUP_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function createTrip(trip: {
  provider_id: string;
  destination_id: string;
  trip_type: string;
  departure_date: string;
  return_date?: string;
  price: number;
  currency?: 'ETB' | 'USD';
  max_seats: number;
  minimum_interest?: number;
  tour_category?: string;
  itinerary?: string;
  summary?: string;
  duration_minutes?: number;
  transportation_type?: string;
  difficulty_level?: string;
  inclusions?: string[];
  exclusions?: string[];
  meeting_instructions?: string;
  what_to_bring?: string;
  cancellation_policy?: string;
  pickup_stations?: Array<{ station_id: string; pickup_time: string; extra_price: number }>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!trip.provider_id || !trip.destination_id || !trip.trip_type) {
    return { success: false, error: 'Choose a provider, destination, and trip type.' };
  }

  const departure = Date.parse(trip.departure_date);
  if (!Number.isFinite(departure) || departure <= Date.now()) {
    return { success: false, error: 'Choose a future departure date and time.' };
  }

  const stations = trip.pickup_stations;
  const returnDate = trip.trip_type === 'one_way' ? undefined : trip.return_date;
  if (trip.trip_type === 'round_trip' || returnDate) {
    const arrival = Date.parse(returnDate ?? '');
    // Bulk schedules share the departure time and can use the same calendar day.
    if (!Number.isFinite(arrival) || arrival < departure || (stations !== undefined && arrival === departure)) {
      return { success: false, error: 'Choose a return date and time after departure.' };
    }
  }

  if (!Number.isFinite(trip.price) || trip.price <= 0) {
    return { success: false, error: 'Enter a price greater than zero.' };
  }

  if (trip.currency !== undefined && trip.currency !== 'ETB' && trip.currency !== 'USD') {
    return { success: false, error: 'Choose ETB or USD as the trip currency.' };
  }

  const seatLimit = stations === undefined ? MAX_TRIP_INTEGER : 100;
  if (!Number.isInteger(trip.max_seats) || trip.max_seats < 1 || trip.max_seats > seatLimit) {
    return { success: false, error: `Enter a whole seat count between 1 and ${seatLimit.toLocaleString()}.` };
  }

  const minimumInterest = trip.minimum_interest;
  if (minimumInterest !== undefined && (
    !Number.isInteger(minimumInterest) || minimumInterest < 1 || minimumInterest > MAX_TRIP_INTEGER
  )) {
    return { success: false, error: 'Enter a valid whole number for the interest goal.' };
  }

  const duration = trip.duration_minutes;
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 1 || duration > MAX_TRIP_INTEGER)) {
    return { success: false, error: 'Enter a valid trip duration.' };
  }

  const summary = trip.summary?.trim();
  if (stations !== undefined) {
    if (!summary || summary.length > 280) {
      return { success: false, error: 'Write a trip summary of 1 to 280 characters.' };
    }
    if (!stations.length) {
      return { success: false, error: 'Select at least one pickup station.' };
    }
    if (stations.some((station) => !station.station_id || !PICKUP_TIME_PATTERN.test(station.pickup_time)
      || !Number.isFinite(station.extra_price) || station.extra_price < 0)) {
      return { success: false, error: 'Check the pickup time and extra price for each selected station.' };
    }
    if (new Set(stations.map((station) => station.station_id)).size !== stations.length) {
      return { success: false, error: 'Select each pickup station once.' };
    }
  }

  const tripData = {
    provider_id: trip.provider_id,
    destination_id: trip.destination_id,
    trip_type: trip.trip_type,
    departure_date: trip.departure_date,
    return_date: returnDate,
    date: getTripDateParts(trip.departure_date).date,
    price: trip.price,
    currency: trip.currency,
    max_seats: trip.max_seats,
    available_seats: trip.max_seats,
    status: minimumInterest === undefined ? 'upcoming' : 'collecting_interest',
    minimum_interest: minimumInterest,
    tour_category: trip.tour_category,
    summary,
    itinerary: trip.itinerary,
    duration_minutes: duration,
    transportation_type: trip.transportation_type,
    difficulty_level: trip.difficulty_level,
    inclusions: trip.inclusions,
    exclusions: trip.exclusions,
    meeting_instructions: trip.meeting_instructions,
    what_to_bring: trip.what_to_bring,
    cancellation_policy: trip.cancellation_policy,
  };

  if (stations !== undefined) {
    const { data: id, error } = await supabase.rpc('create_provider_trip', {
      p_trip: tripData,
      p_pickup_stations: stations,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, id };
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

  return { success: true, id: data.id };
}

export interface ProviderReview {
  id: string; rating: number; comment: string | null; provider_response: string | null;
  created_at: string; helpful_count: number; customer: string; trip: string;
}

export async function getProviderReviews(providerId: string): Promise<ProviderReview[]> {
  const { data, error } = await supabase.from('reviews')
    .select('id,rating,comment,provider_response,created_at,helpful_count,users(name),bookings(trips(destinations(name)))')
    .eq('provider_id', providerId).eq('is_visible', true).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((review: any) => ({
    id: review.id, rating: review.rating, comment: review.comment, provider_response: review.provider_response,
    created_at: review.created_at, helpful_count: review.helpful_count || 0,
    customer: review.users?.name || 'Anonymous', trip: review.bookings?.trips?.destinations?.name || 'Unknown trip',
  }));
}

export async function respondToReview(id: string, response: string) {
  const { error } = await supabase.from('reviews').update({ provider_response: response, provider_response_at: new Date().toISOString() }).eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
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
  },
  expectedStatus?: string,
): Promise<{ success: boolean; error?: string }> {
  const updateData: any = { ...updates };
  
  // Handle departure_date and date column
  if (updates.departure_date) {
    updateData.departure_date = updates.departure_date;
    updateData.date = getTripDateParts(updates.departure_date).date;
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
  
  let query = supabase
    .from('trips')
    .update(updateData)
    .eq('id', tripId);

  if (expectedStatus) {
    query = query.eq('status', expectedStatus);
  }

  const { data, error } = await query.select('id');
  
  if (error) {
    console.error('Error updating trip:', error);
    return { success: false, error: error.message };
  }

  if (!data?.length) {
    return { success: false, error: 'The trip could not be updated. Reopen it to check its current status.' };
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
  status: 'active' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
  expectedStatus?: string,
): Promise<{ success: boolean; error?: string }> {
  return updateTrip(tripId, { status }, expectedStatus);
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
  emergency_contact?: string | null;
  status: 'available' | 'on_trip' | 'offline';
  created_at: string;
}

export async function getDrivers(providerId: string): Promise<Driver[]> {
  const { data, error } = await supabase
    .from('drivers')
    .select('id,name,phone,license_number,avatar_url,emergency_contact,status,created_at')
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
  emergency_contact?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      ...driver,
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

export interface Vehicle {
  id: string;
  provider_id: string;
  driver_id: string | null;
  plate_number: string;
  vehicle_type: string;
  capacity: number;
  make: string | null;
  model: string | null;
  year: number | null;
  image_url: string | null;
  inspection_expiry: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  driver: { id: string; name: string } | null;
}

export async function getVehicles(providerId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles')
    .select('id,provider_id,driver_id,plate_number,vehicle_type,capacity,make,model,year,image_url,inspection_expiry,status,driver:drivers(id,name)')
    .eq('provider_id', providerId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((vehicle: any) => ({ ...vehicle, driver: Array.isArray(vehicle.driver) ? vehicle.driver[0] || null : vehicle.driver })) as Vehicle[];
}

export async function createVehicle(vehicle: {
  provider_id: string; plate_number: string; vehicle_type: string; capacity: number;
  make?: string; model?: string; year?: number;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('vehicles').insert(vehicle);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function updateVehicleStatus(id: string, status: Vehicle['status']) {
  const { error } = await supabase.from('vehicles').update({ status }).eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
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
  currency: TripCurrency;
  totalEarnings: number;
  providerFees: number;
  pendingPayout: number | null;
  lastPayout: { amount: number; currency: string; processedAt: string | null } | null;
  monthlyData: { month: string; earnings: number }[];
}

export async function getEarningsSummary(providerId: string, currency: TripCurrency = 'ETB'): Promise<EarningsSummary> {
  const now = new Date();
  const startOfChart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [allBookingsResult, recentBookingsResult, pendingPayoutsResult, lastPayoutResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('base_price, total_price, provider_fee')
      .eq('provider_id', providerId)
      .eq('currency', currency)
      .eq('payment_status', 'paid'),
    supabase
      .from('bookings')
      .select('base_price, total_price, created_at')
      .eq('provider_id', providerId)
      .eq('currency', currency)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfChart.toISOString()),
    supabase
      .from('payouts')
      .select('amount')
      .eq('provider_id', providerId)
      .eq('currency', currency)
      .in('status', ['pending', 'processing']),
    supabase
      .from('payouts')
      .select('amount, currency, processed_at')
      .eq('provider_id', providerId)
      .eq('currency', currency)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (allBookingsResult.error) throw allBookingsResult.error;
  if (recentBookingsResult.error) throw recentBookingsResult.error;

  const totalEarnings = allBookingsResult.data.reduce((sum, booking) => sum + Number(booking.base_price ?? booking.total_price), 0);
  const providerFees = allBookingsResult.data.reduce((sum, booking) => sum + Number(booking.provider_fee ?? 0), 0);
  const pendingPayouts = pendingPayoutsResult.data;
  const pendingPayout = pendingPayouts?.length
    ? pendingPayouts.reduce((sum, payout) => sum + Number(payout.amount), 0)
    : null;
  const latestPayout = lastPayoutResult.data;
  const lastPayout = latestPayout ? {
    amount: Number(latestPayout.amount),
    currency: latestPayout.currency || 'ETB',
    processedAt: latestPayout.processed_at,
  } : null;

  // Group by month
  const monthlyData: { [key: string]: number } = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = months[d.getMonth()];
    monthlyData[key] = 0;
  }

  recentBookingsResult.data.forEach((b) => {
    const d = new Date(b.created_at);
    const key = months[d.getMonth()];
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += Number(b.base_price ?? b.total_price);
    }
  });

  return {
    currency,
    totalEarnings,
    providerFees,
    pendingPayout,
    lastPayout,
    monthlyData: Object.entries(monthlyData).map(([month, earnings]) => ({
      month,
      earnings,
    })),
  };
}

export interface ProviderSupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
}

export async function getProviderSupportTickets(providerId: string): Promise<ProviderSupportTicket[]> {
  const { data, error } = await supabase.from('support_tickets')
    .select('id,ticket_number,subject,status,created_at').eq('provider_id', providerId)
    .order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data || [];
}

export async function createProviderSupportTicket(providerId: string, subject: string, description: string) {
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await supabase.from('support_tickets').insert({ provider_id: providerId, ticket_number: ticketNumber, subject, description, category: 'technical', priority: 'medium', status: 'open' });
  return error ? { success: false, error: error.message } : { success: true };
}


