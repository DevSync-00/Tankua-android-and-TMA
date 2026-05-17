import { supabase } from './supabase';

// Get featured tours/destinations for homepage
export async function getFeaturedTours(limit: number = 4) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        destination:destinations(id, name, city, category, images, description),
        provider:providers(id, name, rating)
      `)
      .eq('status', 'upcoming')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return await Promise.all((data || []).map(async (trip: any) => {
      const dest = trip.destination;

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', trip.provider?.id)
        .eq('is_visible', true);

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('provider_id', trip.provider?.id)
        .eq('is_visible', true);

      const avgRating = reviewData && reviewData.length > 0
        ? reviewData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewData.length
        : trip.provider?.rating || 4.5;

      return {
        id: trip.id,
        name: dest?.name || 'Unknown Destination',
        location: dest?.city || 'Unknown',
        category: dest?.category || 'General',
        image: dest?.images?.[0] || 'https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        rating: avgRating,
        reviews: reviewCount || 0,
        price: trip.price || 1000,
        description: dest?.description || '',
      };
    }));
  } catch (error) {
    console.error('Error fetching featured tours:', error);
    return [];
  }
}

export async function getTours(options?: {
  search?: string;
  category?: string;
  region?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('trips')
      .select(`
        *,
        destination:destinations(id, name, city, category, images, description, region),
        provider:providers(id, name, rating)
      `, { count: 'exact' })
      .eq('status', 'upcoming')
      .order('departure_date', { ascending: true });

    if (options?.search) {
      query = query.or(`destination.name.ilike.%${options.search}%`);
    }

    if (options?.category) {
      query = query.eq('destination.category', options.category);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const toursWithReviews = await Promise.all((data || []).map(async (trip: any) => {
      const dest = trip.destination;

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('provider_id', trip.provider?.id)
        .eq('is_visible', true);

      return {
        id: trip.id,
        name: dest?.name || 'Unknown Destination',
        location: dest?.city || 'Unknown',
        region: dest?.region || 'Unknown',
        category: dest?.category || 'general',
        image: dest?.images?.[0] || 'https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        rating: trip.provider?.rating || 4.5,
        reviews: reviewCount || 0,
        price: trip.price || 1000,
        description: dest?.description || '',
        tags: dest?.category ? [dest.category] : [],
      };
    }));

    return {
      tours: toursWithReviews,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching tours:', error);
    return { tours: [], total: 0 };
  }
}

export async function getDestinations(options?: {
  search?: string;
  category?: string;
  region?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('destinations')
      .select('*', { count: 'exact' })
      .order('name');

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,city.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.region) {
      query = query.eq('region', options.region);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const destinationsWithReviews = await Promise.all((data || []).map(async (dest: any) => {
      const { data: tripsData } = await supabase
        .from('trips')
        .select('provider_id')
        .eq('destination_id', dest.id)
        .limit(1);

      let reviewCount = 0;
      let avgRating = 4.5;

      if (tripsData && tripsData.length > 0 && tripsData[0].provider_id) {
        const { count: rc } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', tripsData[0].provider_id)
          .eq('is_visible', true);

        const { data: reviewData } = await supabase
          .from('reviews')
          .select('rating')
          .eq('provider_id', tripsData[0].provider_id)
          .eq('is_visible', true);

        reviewCount = rc || 0;
        if (reviewData && reviewData.length > 0) {
          avgRating = reviewData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewData.length;
        }
      }

      const { data: priceData } = await supabase
        .from('trips')
        .select('price')
        .eq('destination_id', dest.id)
        .not('price', 'is', null)
        .limit(10);

      const avgPrice = priceData && priceData.length > 0
        ? priceData.reduce((sum, t) => sum + (t.price || 0), 0) / priceData.length
        : 1500;

      return {
        id: dest.id,
        name: dest.name,
        location: dest.city,
        region: dest.region || 'Unknown',
        category: dest.category || 'general',
        image: dest.images?.[0] || 'https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop',
        rating: avgRating,
        reviews: reviewCount,
        price: Math.round(avgPrice),
        description: dest.description || '',
        tags: dest.tags || [dest.category].filter(Boolean),
      };
    }));

    return {
      destinations: destinationsWithReviews,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return { destinations: [], total: 0 };
  }
}

export async function getTourById(id: string) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        destination:destinations(*),
        provider:providers(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const dest = data.destination;
    return {
      id: data.id,
      name: dest?.name || 'Unknown',
      location: dest?.city || 'Unknown',
      region: dest?.region || 'Unknown',
      category: dest?.category || 'general',
      images: dest?.images || [],
      rating: data.provider?.rating || 4.5,
      reviews: Math.floor(Math.random() * 2000) + 500,
      price: data.price || 1000,
      description: dest?.description || '',
      provider: data.provider,
      departureDate: data.departure_date,
      tripType: data.trip_type,
    };
  } catch (error) {
    console.error('Error fetching tour:', error);
    return null;
  }
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    console.log('Contact form submission:', data);
    return { success: true };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { success: false, error };
  }
}
