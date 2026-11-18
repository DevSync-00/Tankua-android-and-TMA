import { supabase } from './supabase';

const FALLBACK_TOUR_IMAGE = 'https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop';

type CatalogOptions = {
  search?: string;
  category?: string;
  region?: string;
  limit?: number;
  offset?: number;
  bookableOnly?: boolean;
};

type ReviewSummary = {
  rating: number;
  count: number;
};

const listingColumns = `
  id, price, status, minimum_interest, interest_count,
  destination:destinations!inner(name, city, category, images, description, region),
  provider:providers(id)
`;

function buildSearchFilter(search: string) {
  const pattern = JSON.stringify(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
  return ['name', 'city', 'description'].map((column) => `${column}.ilike.${pattern}`).join(',');
}

async function getProviderReviewSummary(providerId?: string): Promise<ReviewSummary | null> {
  if (!providerId) return null;

  const pageSize = 500;
  let count = 0;
  let sum = 0;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .order('id')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching provider reviews:', error);
      return null;
    }

    for (const { rating } of data) {
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        count += 1;
        sum += rating;
      }
    }

    if (data.length < pageSize) break;
  }

  return count > 0 ? { rating: sum / count, count } : null;
}

function mapListing(trip: {
  id: string;
  price: number | null;
  status: string;
  minimum_interest: number | null;
  interest_count: number;
  destination: {
    name: string;
    city: string | null;
    region: string | null;
    category: string | null;
    images: string[] | null;
    description: string | null;
  };
}, providerReviews: ReviewSummary | null) {
  const destination = trip.destination;
  return {
    id: trip.id,
    name: destination.name,
    location: destination.city || destination.region || 'Ethiopia',
    region: destination.region,
    category: destination.category || 'general',
    image: destination.images?.[0] || FALLBACK_TOUR_IMAGE,
    price: trip.price,
    interest: trip.status === 'collecting_interest' && trip.minimum_interest !== null
      ? { count: trip.interest_count, minimum: trip.minimum_interest }
      : null,
    description: destination.description || '',
    tags: destination.category ? [destination.category] : [],
    providerReviews,
  };
}

export function getFeaturedTours(limit = 4) {
  return loadTours({ limit }, 'created_at', false);
}

export function getTours(options?: CatalogOptions) {
  return loadTours(options, 'departure_date', true, true);
}

async function loadTours(
  options: CatalogOptions | undefined,
  orderBy: 'created_at' | 'departure_date',
  ascending: boolean,
  includeInterest = false,
) {
  try {
    let query = supabase
      .from('trips')
      .select(listingColumns, { count: 'exact' })
      .order(orderBy, { ascending });

    query = includeInterest && !options?.bookableOnly
      ? query.in('status', ['upcoming', 'collecting_interest'])
        .or(`minimum_interest.is.null,departure_date.gt.${new Date().toISOString()}`)
      : query.eq('status', 'upcoming');

    if (options?.bookableOnly) {
      query = query.gt('departure_date', new Date().toISOString()).gte('available_seats', 1);
    }

    const search = options?.search?.trim();
    if (search) {
      query = query.or(buildSearchFilter(search), { referencedTable: 'destination' });
    }
    if (options?.category) {
      query = query.eq('destination.category', options.category);
    }
    if (options?.region) {
      query = query.eq('destination.region', options.region);
    }
    if (options?.limit || options?.offset) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const trips = data as unknown as (Parameters<typeof mapListing>[0] & {
      provider: { id: string } | null;
    })[];
    const providerIds = new Set(trips.map((trip) => trip.provider?.id).filter((id): id is string => Boolean(id)));
    const reviews = new Map(await Promise.all(Array.from(providerIds, async (id) => (
      [id, await getProviderReviewSummary(id)] as const
    ))));

    return {
      tours: trips.map((trip) => mapListing(trip, reviews.get(trip.provider?.id ?? '') ?? null)),
      total: count ?? 0,
      error: false,
    };
  } catch (error) {
    console.error('Error fetching tours:', error);
    return { tours: [], total: 0, error: true };
  }
}

export async function getDestinations(options?: CatalogOptions) {
  try {
    let query = supabase
      .from('destinations')
      .select('id, name, city, region, category, images, description, tags, trips(price)', { count: 'exact' })
      .eq('trips.status', 'upcoming')
      .gt('trips.departure_date', new Date().toISOString())
      .not('trips.price', 'is', null)
      .order('price', { referencedTable: 'trips' })
      .limit(1, { referencedTable: 'trips' })
      .order('name');

    const search = options?.search?.trim();
    if (search) {
      query = query.or(buildSearchFilter(search));
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.region) {
      query = query.eq('region', options.region);
    }
    if (options?.limit || options?.offset) {
      const offset = options.offset ?? 0;
      query = query.range(offset, offset + (options.limit || 20) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      destinations: data.map((destination) => ({
        id: destination.id as string,
        name: destination.name as string,
        location: (destination.city || destination.region || 'Ethiopia') as string,
        category: (destination.category || 'general') as string,
        image: (destination.images?.[0] || FALLBACK_TOUR_IMAGE) as string,
        price: (destination.trips?.[0]?.price ?? null) as number | null,
        description: (destination.description || '') as string,
        tags: (destination.tags || [destination.category].filter(Boolean)) as string[],
      })),
      total: count ?? 0,
      error: false,
    };
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return { destinations: [], total: 0, error: true };
  }
}

export async function getTourById(id: string) {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        destination:destinations(name, city, region, category, images, description),
        provider:providers(id, name, description)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const destination = data.destination;
    const provider = data.provider as unknown as { id: string; name: string; description: string | null } | null;
    const departureDate = data.departure_date as string | null;
    const minimumInterest = (data.minimum_interest ?? null) as number | null;
    const isFutureDeparture = departureDate !== null && Date.parse(departureDate) > Date.now();
    const interest = data.status === 'collecting_interest' && minimumInterest !== null && isFutureDeparture
      ? { count: data.interest_count as number, minimum: minimumInterest }
      : null;
    const bookingOpen = (data.status === 'upcoming' || data.status === 'active')
      && (minimumInterest === null || isFutureDeparture);

    return {
      id: data.id as string,
      name: (destination?.name || 'Unknown Destination') as string,
      location: (destination?.city || destination?.region || 'Ethiopia') as string,
      category: (destination?.category || 'general') as string,
      image: (destination?.images?.[0] || FALLBACK_TOUR_IMAGE) as string,
      price: (data.price ?? null) as number | null,
      interest,
      bookingOpen,
      description: (data.summary || destination?.description || '') as string,
      provider,
      providerReviews: await getProviderReviewSummary(provider?.id),
      departureDate,
      tripType: (data.trip_type ?? null) as string | null,
      durationMinutes: (data.duration_minutes ?? null) as number | null,
      inclusions: (data.inclusions ?? []) as string[],
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
