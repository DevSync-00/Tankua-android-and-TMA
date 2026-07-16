import { supabase } from '../config/supabase';

// ============================================
// USERS
// ============================================

export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// ============================================
// DESTINATIONS
// ============================================

const DESTINATIONS_TABLE = 'destinations';

// A set of beautiful Unsplash travel/nature placeholders for Ethiopian destinations
export const PLACEHOLDER_IMAGES = {
  nature: [
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800', // Simien Mountains landscape (Nature)
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', // Rift Valley Safari (Nature / Wildlife)
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800', // Lush green highlands (Nature)
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800', // Blue Nile Falls / waterfall (Scenic)
  ],
  adventure: [
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800', // Danakil Depression / desert (Adventure)
  ],
  historical: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800', // Gondar Castle / Historic (Historical/Monument/Museum/Cultural)
  ],
  religious: [
    'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800', // Axum St. Mary / Church (Religious/Sacred)
    'https://images.unsplash.com/photo-1605106901227-991bd663255c?w=800', // Bahir Dar Lake Tana Church
  ],
  city: [
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800', // Addis Ababa city life (City)
  ],
  other: [
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', // Default Rift Valley Safari
  ]
};

export const getPlaceholderImage = (id, name, category) => {
  let list = PLACEHOLDER_IMAGES.other;
  if (category) {
    const cat = String(category).toLowerCase();
    if (cat.includes('nature') || cat.includes('park')) {
      list = PLACEHOLDER_IMAGES.nature;
    } else if (cat.includes('adventure')) {
      list = PLACEHOLDER_IMAGES.adventure;
    } else if (cat.includes('historical') || cat.includes('monument') || cat.includes('museum') || cat.includes('cultural')) {
      list = PLACEHOLDER_IMAGES.historical;
    } else if (cat.includes('religious') || cat.includes('sacred') || cat.includes('church')) {
      list = PLACEHOLDER_IMAGES.religious;
    } else if (cat.includes('city')) {
      list = PLACEHOLDER_IMAGES.city;
    }
  }

  // Fallback to deterministic selection using id or name hash
  let hash = 0;
  const str = String(id || name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
};

export const ensureDestinationImages = (dest) => {
  if (!dest) return dest;
  const images = dest.images;
  const hasValidImage = Array.isArray(images) && images.length > 0 && images.some(img => 
    typeof img === 'string' && 
    img.trim().length > 0 && 
    !img.includes('wikimedia.org') && 
    !img.includes('wikipedia.org')
  );
  if (!hasValidImage) {
    return {
      ...dest,
      images: [getPlaceholderImage(dest.id, dest.name, dest.category)],
    };
  }
  return dest;
};

export const createDestination = async (destinationData) => {
  try {
    const tableName = DESTINATIONS_TABLE;
    const { data, error } = await supabase
      .from(tableName)
      .insert([destinationData])
      .select()
      .single();

    if (error) throw error;
    return ensureDestinationImages(data);
  } catch (error) {
    throw error;
  }
};

export const getDestinations = async (filters = {}) => {
  try {
    const tableName = DESTINATIONS_TABLE;
    let query = supabase
      .from(tableName)
      .select('*');
    
    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(ensureDestinationImages);
  } catch (error) {
    throw error;
  }
};

export const getDestination = async (destinationId) => {
  try {
    const tableName = DESTINATIONS_TABLE;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', destinationId)
      .single();

    if (error) throw error;
    return ensureDestinationImages(data);
  } catch (error) {
    throw error;
  }
};

export const updateDestination = async (destinationId, updates) => {
  try {
    const tableName = DESTINATIONS_TABLE;
    const { error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', destinationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const deleteDestination = async (destinationId) => {
  try {
    const tableName = DESTINATIONS_TABLE;
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', destinationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// ============================================
// TRIPS
// ============================================

export const createTrip = async (tripData) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTrips = async (filters = {}) => {
  try {
    let query = supabase
      .from('trips')
      .select(`
        *,
        providers (
          id,
          name,
          logo_url,
          rating,
          phone,
          description
        ),
        destinations (
          id,
          name,
          city,
          region,
          category,
          images
        )
      `);

    if (filters.destinationId) {
      query = query.eq('destination_id', filters.destinationId);
    }

    if (filters.category) {
      query = query.eq('destinations.category', filters.category);
    }

    if (filters.tourCategory) {
      query = query.eq('tour_category', filters.tourCategory);
    }

    if (filters.region) {
      query = query.eq('destinations.region', filters.region);
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.dateFrom) {
      query = query.gte('departure_date', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('departure_date', filters.dateTo);
    }

    query = query.in('status', ['upcoming', 'active']);
    query = query.gte('available_seats', 1);
    query = query.order('departure_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    
    // Ensure nested destination images are populated with fallback placeholders
    const processedTrips = (data || []).map(trip => {
      if (trip.destinations) {
        trip.destinations = ensureDestinationImages(trip.destinations);
      }
      return trip;
    });

    return processedTrips;
  } catch (error) {
    throw error;
  }
};

// ============================================
// PICKUP STATIONS
// ============================================

export const createPickupStation = async (stationData) => {
  try {
    const { data, error } = await supabase
      .from('pickup_stations')
      .insert([stationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getPickupStations = async () => {
  try {
    const { data, error } = await supabase
      .from('pickup_stations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const updatePickupStation = async (stationId, updates) => {
  try {
    const { error } = await supabase
      .from('pickup_stations')
      .update(updates)
      .eq('id', stationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const deletePickupStation = async (stationId) => {
  try {
    const { error } = await supabase
      .from('pickup_stations')
      .delete()
      .eq('id', stationId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// ============================================
// TRIP PICKUP STATIONS
// ============================================

export const linkStationToTrip = async (tripId, stationId, pickupTime, extraPrice) => {
  try {
    const { data, error } = await supabase
      .from('trip_pickup_stations')
      .insert([{
        trip_id: tripId,
        station_id: stationId,
        pickup_time: pickupTime,
        extra_price: extraPrice,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTripStations = async (tripId) => {
  try {
    const { data, error } = await supabase
      .from('trip_pickup_stations')
      .select(`
        *,
        pickup_stations (*)
      `)
      .eq('trip_id', tripId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

// ============================================
// BOOKINGS
// ============================================

export const createBooking = async (bookingData) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getAllBookings = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const updateBooking = async (bookingId, updates) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// ============================================
// DRIVERS
// ============================================

export const createDriver = async (driverData) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getDrivers = async () => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const updateDriver = async (driverId, updates) => {
  try {
    const { error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const deleteDriver = async (driverId) => {
  try {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// ============================================
// PROVIDERS
// ============================================

export const createProvider = async (providerData) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .insert([providerData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getProviders = async (filters = {}) => {
  try {
    const destinationId = filters.destinationId;

    if (destinationId && filters.date) {
      const dateStart = `${filters.date}T00:00:00`;
      const dateEnd = `${filters.date}T23:59:59`;

      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('provider_id')
        .in('status', ['upcoming', 'active'])
        .gte('available_seats', 1)
        .gte('departure_date', dateStart)
        .lte('departure_date', dateEnd)
        .eq('destination_id', destinationId);

      if (tripsError) throw tripsError;

      // Extract unique provider IDs
      const providerIds = [...new Set((trips || []).map(trip => trip.provider_id).filter(Boolean))];

      if (providerIds.length === 0) {
        return []; // No providers available for this destination and date
      }

      // Get provider details for those providers
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .in('id', providerIds)
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    // If no filters, return all active providers (for backward compatibility)
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('status', 'active')
      .order('rating', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const getProvider = async (providerId) => {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProvider = async (providerId, updates) => {
  try {
    const { error } = await supabase
      .from('providers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', providerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

export const deleteProvider = async (providerId) => {
  try {
    const { error } = await supabase
      .from('providers')
      .update({ status: 'inactive' })
      .eq('id', providerId);

    if (error) throw error;
  } catch (error) {
    throw error;
  }
};