'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, Bell, Bus, CalendarDays, Check, ChevronRight, CircleHelp,
  Building2, Clock3, Compass, Gift, Heart, Home, Info, LocateFixed, Map as MapIcon,
  MapPin, Minus, Navigation, Plus, Search, Share2, ShieldCheck, Star,
  Tag, Ticket, UserRound, UsersRound, X, LogOut, Settings, Phone, ShieldAlert
} from 'lucide-react';
import QRCode from 'qrcode';

const fallbackDestinations = [
  { id: 1, name: 'Church of St. George (Biete Ghiorgis)', city: 'Lalibela', region: 'Amhara', category: 'religious', rating: 4.9, reviews: 492, price: 3200, duration: '2 days', image: '/destinations/pexels-mussie-belachew-2153963984-33101756.jpg', description: 'The iconic monolith rock-hewn church carved from red volcanic tuff in the shape of a Greek cross. The most famous symbol of Lalibela.', location: { lat: 12.0319, lng: 39.0411 } },
  { id: 2, name: 'Abuna Yemata Guh Cliff Church', city: 'Hawzen', region: 'Tigray', category: 'religious', rating: 4.8, reviews: 156, price: 4500, duration: '2 days', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'A dramatic 5th-century rock-cut church situated 200 meters up a sheer vertical rock face in the Gheralta Mountains.', location: { lat: 13.9142, lng: 39.3602 } },
  { id: 3, name: 'Debre Libanos Monastery', city: 'Debre Libanos', region: 'Oromia', category: 'religious', rating: 4.6, reviews: 184, price: 1800, duration: '1 day', image: '/destinations/onboarding-fasil-ghebbi.png', description: 'Historic 13th-century monastery founded by Saint Tekle Haymanot, overlooking the Jamma River Gorge.', location: { lat: 9.7140, lng: 38.8540 } },
  { id: 4, name: 'Debre Birhan Selassie Church', city: 'Gondar', region: 'Amhara', category: 'religious', rating: 4.8, reviews: 290, price: 2200, duration: '1 day', image: '/destinations/pexels-lovetosmile-5034469.jpg', description: 'Celebrated 17th-century church in Gondar famed for its ceiling decorated with hundreds of painted winged angel faces.', location: { lat: 12.6122, lng: 37.4722 } },
  { id: 5, name: 'Ura Kidane Mehret Monastery', city: 'Bahir Dar', region: 'Amhara', category: 'religious', rating: 4.7, reviews: 210, price: 2000, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: 'Famous 14th-century circular island monastery on the Zege Peninsula of Lake Tana, renowned for vivid murals.', location: { lat: 11.6975, lng: 37.3312 } },
  { id: 6, name: 'Holy Trinity Cathedral', city: 'Addis Ababa', region: 'Addis Ababa', category: 'sacred', rating: 4.7, reviews: 310, price: 1200, duration: 'Half day', image: '/destinations/onboarding-fasil-ghebbi.png', description: 'The highest-ranking Orthodox Cathedral in Addis Ababa, holding the tombs of Emperor Haile Selassie.', location: { lat: 9.0305, lng: 38.7618 } },
  { id: 7, name: 'Fasil Ghebbi (Royal Enclosure)', city: 'Gondar', region: 'Amhara', category: 'historical', rating: 4.9, reviews: 328, price: 2400, duration: '2 days', image: '/destinations/onboarding-fasil-ghebbi.png', description: '17th-century fortress city built by Emperor Fasilides, featuring stone castles known as the Camelot of Africa.', location: { lat: 12.6080, lng: 37.4673 } },
  { id: 8, name: 'Obelisk of Axum', city: 'Axum', region: 'Tigray', category: 'historical', rating: 4.8, reviews: 275, price: 3000, duration: '2 days', image: '/destinations/pexels-mussie-belachew-2153963984-33101756.jpg', description: 'Ancient 1,700-year-old phonolite stela standing 24 meters high, marking royal burial chambers of the Aksumite Kingdom.', location: { lat: 14.1311, lng: 38.7194 } },
  { id: 9, name: 'Harar Jugol Walled City', city: 'Harar', region: 'Harari', category: 'cultural', rating: 4.7, reviews: 201, price: 2800, duration: '2 days', image: '/destinations/pexels-lovetosmile-5034469.jpg', description: 'The 4th holiest city of Islam, surrounded by 16th-century stone walls with 82 mosques and 102 shrines.', location: { lat: 9.3117, lng: 42.1283 } },
  { id: 10, name: 'Tiya Megalithic Standing Stones', city: 'Tiya', region: 'SNNPR', category: 'historical', rating: 4.5, reviews: 120, price: 1500, duration: '1 day', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'UNESCO World Heritage site containing 36 carved megalithic stelae marking ancient burial sites.', location: { lat: 8.4347, lng: 38.6117 } },
  { id: 11, name: 'Portuguese Bridge', city: 'Debre Libanos', region: 'Oromia', category: 'historical', rating: 4.6, reviews: 145, price: 1600, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: '17th-century stone bridge spanning a waterfall in the Jamma River Gorge, frequented by endemic Gelada baboons.', location: { lat: 9.7198, lng: 38.8512 } },
  { id: 12, name: 'Palace of Abba Jifar', city: 'Jimma', region: 'Oromia', category: 'historical', rating: 4.5, reviews: 98, price: 2100, duration: '1 day', image: '/destinations/onboarding-fasil-ghebbi.png', description: 'Wooden 19th-century royal palace of the Kingdom of Jimma, built by King Abba Jifar II at Jiren.', location: { lat: 7.6767, lng: 36.8344 } },
  { id: 13, name: 'Simien Mountains National Park', city: 'Debark', region: 'Amhara', category: 'nature', rating: 4.8, reviews: 267, price: 4800, duration: '3 days', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'Spectacular mountain scenery featuring Ras Dashen, home to Walia ibex, Gelada baboons, and Ethiopian wolves.', location: { lat: 13.2500, lng: 38.0000 } },
  { id: 14, name: 'Bale Mountains National Park', city: 'Dinsho', region: 'Oromia', category: 'nature', rating: 4.8, reviews: 215, price: 5200, duration: '3 days', image: '/destinations/pexels-lovetosmile-5034469.jpg', description: 'High-altitude Afro-alpine plateau protecting the world’s largest population of rare Ethiopian wolves.', location: { lat: 6.9000, lng: 39.7500 } },
  { id: 15, name: 'Awash National Park', city: 'Awash', region: 'Afar', category: 'wildlife', rating: 4.6, reviews: 162, price: 3600, duration: '2 days', image: '/destinations/onboarding-dallol.png', description: 'Acacia woodland reserve centered around Awash Falls, harboring Beisa oryx, kudus, and over 450 bird species.', location: { lat: 8.8833, lng: 40.0167 } },
  { id: 16, name: 'Nechisar National Park', city: 'Arbaminch', region: 'SNNPR', category: 'wildlife', rating: 4.7, reviews: 178, price: 3800, duration: '2 days', image: '/destinations/onboarding-waterfall.png', description: 'White grass plains situated between Lakes Abaya and Chamo, famous for giant Nile crocodiles and Burchell’s zebras.', location: { lat: 5.9333, lng: 37.5500 } },
  { id: 17, name: 'Omo National Park', city: 'Jinka', region: 'SNNPR', category: 'wildlife', rating: 4.7, reviews: 134, price: 6500, duration: '4 days', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'Remote wildlife refuge along the West bank of the Omo River, home to large herds of elands, buffalos, and giraffes.', location: { lat: 5.7833, lng: 35.8333 } },
  { id: 18, name: 'Abijatta-Shalla Lakes National Park', city: 'Batu', region: 'Oromia', category: 'park', rating: 4.5, reviews: 140, price: 2500, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: 'Twin Rift Valley crater lakes renowned for massive flocks of lesser flamingos and natural boiling sulfur hot springs.', location: { lat: 7.5000, lng: 38.6000 } },
  { id: 19, name: 'Erta Ale Volcano & Lava Lake', city: 'Dallol', region: 'Afar', category: 'adventure', rating: 4.9, reviews: 298, price: 9500, duration: '3 days', image: '/destinations/onboarding-dallol.png', description: 'Continuously active basaltic shield volcano in the Danakil Depression holding one of the world’s rare persistent lava lakes.', location: { lat: 13.6000, lng: 40.6667 } },
  { id: 20, name: 'Dallol Hydrothermal Field', city: 'Dallol', region: 'Afar', category: 'adventure', rating: 4.7, reviews: 184, price: 8800, duration: '3 days', image: '/destinations/onboarding-dallol.png', description: 'Surreal geothermal crater featuring neon-green acidic hot springs, yellow sulfur mounds, and salt formations.', location: { lat: 14.2417, lng: 40.2989 } },
  { id: 21, name: 'Sof Umar Cave System', city: 'Sof Omar', region: 'Oromia', category: 'adventure', rating: 4.5, reviews: 142, price: 3500, duration: '2 days', image: '/destinations/onboarding-dallol.png', description: 'One of Africa’s largest underground cave networks, carved through limestone by the Web River over millennia.', location: { lat: 6.9070, lng: 40.8465 } },
  { id: 22, name: 'Blue Nile Falls (Tis Abay)', city: 'Bahir Dar', region: 'Amhara', category: 'nature', rating: 4.8, reviews: 216, price: 1800, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: 'The grand smoking waterfall on the Blue Nile River dropping 45 meters over basalt cliffs.', location: { lat: 11.4850, lng: 37.5950 } },
  { id: 23, name: 'Gheralta Mountains Trek', city: 'Hawzen', region: 'Tigray', category: 'adventure', rating: 4.9, reviews: 210, price: 5400, duration: '3 days', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'Striking red rock pillars and cliffside ancient monasteries offering premier adventure trekking.', location: { lat: 13.9000, lng: 39.3500 } },
  { id: 24, name: 'Lake Tana Boat Expedition', city: 'Bahir Dar', region: 'Amhara', category: 'ecotourism', rating: 4.7, reviews: 195, price: 2600, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: 'Cruise Ethiopia’s largest lake, source of the Blue Nile, visiting island monasteries and wetland bird habitats.', location: { lat: 11.7000, lng: 37.3000 } },
];

const categories = ['All', 'Historical', 'Nature', 'Adventure', 'Religious', 'Hiking', 'Cultural'];
const tabs = [
  ['home', Home, 'Home'], ['search', Search, 'Search'], ['trips', Bus, 'Trips'],
  ['map', MapIcon, 'Map'], ['profile', UserRound, 'Profile']
];
const WEEKEND_PLANNER_URL = 'https://www.tankua.co/weekend';

const tripCurrency = currency => currency === 'USD' ? 'USD' : 'ETB';
function money(amount, currency) {
  const code = tripCurrency(currency);
  const formatted = Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: code === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${code} ${formatted}`;
}
function vibrate(type = 'light') { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type); }

const cityCoordinates = {
  'addis ababa': [9.03, 38.74], lalibela: [12.03, 39.04], gondar: [12.61, 37.47],
  'bahir dar': [11.59, 37.39], harar: [9.31, 42.13], debark: [13.15, 37.9],
  dallol: [14.24, 40.3], 'sof omar': [6.91, 40.84], axum: [14.13, 38.72],
  hawassa: [7.06, 38.48], arbaminch: [6.04, 37.55],
};

function destinationCoordinates(destination) {
  const location = destination?.location;
  if (Array.isArray(location?.coordinates) && location.coordinates.length >= 2) {
    return [Number(location.coordinates[1]), Number(location.coordinates[0])];
  }
  if (Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng))) {
    return [Number(location.lat), Number(location.lng)];
  }
  if (typeof location === 'string') {
    const point = location.match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
    if (point) return [Number(point[2]), Number(point[1])];
  }
  return cityCoordinates[String(destination?.city || '').toLowerCase()] || [9.03, 38.74];
}

const hasFutureDeparture = trip => Date.parse(trip.departure_date) > Date.now();
const isCollectingInterest = trip => trip.status === 'collecting_interest' && hasFutureDeparture(trip);
const isBookableTrip = trip => (trip.status === 'active' || trip.status === 'upcoming') && hasFutureDeparture(trip);
const isPendingBooking = booking => booking.status === 'confirmed'
  && booking.payment_status === 'pending';
const isAwaitingActivation = booking => isPendingBooking(booking)
  && booking.scheduled_trip?.status === 'upcoming'
  && hasFutureDeparture(booking.scheduled_trip);
const canPayBooking = booking => isPendingBooking(booking)
  && booking.scheduled_trip?.status === 'active'
  && hasFutureDeparture(booking.scheduled_trip)
  && Date.parse(booking.payment_deadline) > Date.now();

export default function App() {
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null);
  const [selected, setSelected] = useState(fallbackDestinations[0]);
  const [linkedTripId, setLinkedTripId] = useState(null);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'telebirr' });
  const [ticketBackScreen, setTicketBackScreen] = useState('confirmation');
  const [bookedTrips, setBookedTrips] = useState([
    {
      id: 'TNK-92041',
      destination_id: 7,
      destination_name: 'Fasil Ghebbi (Royal Enclosure)',
      destination_city: 'Gondar',
      destination_image: '/destinations/onboarding-fasil-ghebbi.png',
      departure_date: '2026-08-15T06:00:00Z',
      pickup_name: 'Meskel Square Station',
      seats: 2,
      payment_status: 'paid',
      status: 'confirmed',
    },
    {
      id: 'TNK-83019',
      destination_id: 1,
      destination_name: 'Church of St. George (Biete Ghiorgis)',
      destination_city: 'Lalibela',
      destination_image: '/destinations/pexels-mussie-belachew-2153963984-33101756.jpg',
      departure_date: '2026-09-04T07:30:00Z',
      pickup_name: 'Bole Brass Station',
      seats: 1,
      payment_status: 'paid',
      status: 'confirmed',
    },
  ]);
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authError, setAuthError] = useState('');
  const [catalog, setCatalog] = useState({ destinations: [], trips: [], providers: [], stations: [], trip_pickup_stations: [] });
  const catalogRequest = useRef(0);
  const bookingsRequest = useRef(0);
  const bookingAttempt = useRef(null);
  const bookingSubmitting = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [profileData, setProfileData] = useState({
    friends: [], suggestions: [], rewards: { current_points: 0, total_earned: 0, total_redeemed: 0 },
    reward_transactions: [], coupons: [], payment_methods: [], notifications: [],
    notification_preferences: { push_enabled: true, sms_enabled: false }, referral_code: '',
  });

  const toggleFavorite = async (id) => {
    const isFav = favorites.includes(id);
    try {
      await api('/api/favorites', {
        method: isFav ? 'DELETE' : 'POST',
        body: JSON.stringify({ destination_id: id }),
      });
      setFavorites(prev => isFav ? prev.filter(item => item !== id) : [...prev, id]);
      notify(isFav ? 'Removed from saved destinations' : 'Added to saved destinations');
    } catch (error) {
      notify(error.message);
    }
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand(); tg.setHeaderColor('#fffaf0'); tg.setBackgroundColor('#fffaf0');
    }
    authenticate();
  }, []);

  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof data.error === 'string'
        ? data.error
        : data.error && typeof data.error === 'object'
          ? Object.values(data.error).flat().map(String).join(', ')
          : `Request failed (${response.status})`;
      throw new Error(errorMessage || `Request failed (${response.status})`);
    }
    return data;
  };

  const loadProductionData = async () => {
    try {
      const [catalogData, bookingsData] = await Promise.all([
        api('/api/catalog').catch(() => ({ destinations: fallbackDestinations, trips: [], providers: [], stations: [], trip_pickup_stations: [] })),
        api('/api/bookings').catch(() => ({ bookings: [] }))
      ]);
      const activeCatalog = catalogData?.destinations?.length ? catalogData : { destinations: fallbackDestinations, trips: [], providers: [], stations: [], trip_pickup_stations: [] };
      setCatalog(activeCatalog);
      setBookedTrips(bookingsData.bookings || []);
      return { catalogData: activeCatalog, bookings: bookingsData.bookings || [] };
    } catch (e) {
      const activeCatalog = { destinations: fallbackDestinations, trips: [], providers: [], stations: [], trip_pickup_stations: [] };
      setCatalog(activeCatalog);
      return { catalogData: activeCatalog, bookings: [] };
    }
  };

  const loadProfileData = async () => {
    const data = await api('/api/profile/overview');
    setProfileData(data);
    setFavorites(data.favorites || []);
    if (data.user?.id) setUser(data.user);
    return data;
  };

  const refreshCatalog = async () => {
    const request = ++catalogRequest.current;
    const catalogData = await api(`/api/catalog?refresh=${Date.now()}`);
    if (request === catalogRequest.current) setCatalog(catalogData);
    return catalogData;
  };

  const refreshBookings = async () => {
    const request = ++bookingsRequest.current;
    const { bookings } = await api('/api/bookings');
    if (request === bookingsRequest.current) setBookedTrips(bookings);
    return bookings;
  };

  const authenticate = async () => {
    try {
      setAuthStatus('loading');
      setAuthError('');
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          setUser({ id: 'dev', name: 'ber.bir' });
          setCatalog({ destinations: fallbackDestinations, trips: [], providers: [], stations: [], trip_pickup_stations: [] });
          setAuthStatus('authenticated');
          return;
        }
        setAuthStatus('telegram-required');
        return;
      }
      const { user: verifiedUser } = await api('/api/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData: tg.initData }),
      });
      setUser(verifiedUser);
      const [productionData] = await Promise.all([
        loadProductionData(),
        loadProfileData().catch(error => {
          console.error('Profile overview unavailable', error);
          return null;
        }),
      ]);
      setAuthStatus('authenticated');
      const params = new URLSearchParams(window.location.search);
      const txRef = params.get('tx_ref');
      if (params.get('payment_return') === '1' && txRef) {
        const payment = await api(`/api/payments/status?tx_ref=${encodeURIComponent(txRef)}`);
        const rawBooking = productionData.bookings.find(item => item.id === payment.booking_id);
        if (payment.paid && rawBooking) {
          const live = productionData.catalogData.destinations.map(normalizeDestination);
          setBooking(normalizeBookingForUi(rawBooking, live));
          setScreen('confirmation');
          vibrate('heavy');
        } else {
          notify('Payment is still processing. Check Trips shortly.');
          setTab('trips');
        }
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const launchParameter = new URLSearchParams(tg.initData).get('start_param');
        const tripId = launchParameter?.match(/^trip_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)?.[1]?.toLowerCase();
        if (tripId) {
          const trip = productionData.catalogData.trips.find(item => item.id === tripId);
          const destination = productionData.catalogData.destinations.find(item => item.id === trip?.destination_id);
          if (destination) {
            setSelected(normalizeDestination(destination));
            setLinkedTripId(trip.id);
            setScreen('detail');
          } else {
            notify('This trip is currently unavailable.');
          }
        }
      }
    } catch (error) {
      setAuthError(error.message);
      setAuthStatus('error');
    }
  };

  const notify = (text) => {
    setToast(text); vibrate('light'); setTimeout(() => setToast(''), 2200);
  };
  const openDetail = (d) => {
    setSelected(d); setLinkedTripId(null); setScreen('detail'); vibrate(); window.scrollTo(0, 0);
    if (user?.id && user.id !== 'dev') refreshCatalog().catch(() => {});
  };
  const goTab = (id) => {
    setTab(id);
    setScreen(null);
    vibrate();
    window.scrollTo(0, 0);
    if (id === 'trips' && user?.id && user.id !== 'dev') refreshBookings().catch(error => notify(error.message));
  };
  const goBack = () => {
    const flow = ['trip', 'pickup', 'seats', 'passengers', 'review'];
    const i = flow.indexOf(screen);
    if (i > 0) setScreen(flow[i - 1]);
    else if (screen === 'trip') setScreen('detail');
    else setScreen(null);
    vibrate();
  };
  const liveDestinations = catalog.destinations.map(normalizeDestination);
  const checkTripInterest = async tripId => {
    try {
      const freshCatalog = await refreshCatalog();
      const trip = freshCatalog.trips.find(item => item.id === tripId);
      if (trip && isBookableTrip(trip)) notify('Reservations are open.');
      else if (trip && isCollectingInterest(trip)) notify('Reservations open once the minimum group size is met.');
      else notify('This trip is currently unavailable.');
    } catch (error) {
      notify(error.message);
    }
  };

  const expressInterest = async trip => {
    try {
      const { interest } = await api(`/api/trips/${trip.id}/interest`, { method: 'POST' });
      const { trip_id, ...updates } = interest;
      const result = { ...trip, ...updates };
      setCatalog(previous => ({
        ...previous,
        trips: previous.trips.map(item => item.id === trip_id ? { ...item, ...updates } : item),
      }));
      if (isBookableTrip(result)) notify(result.interested ? 'Interest registered. Reservations are open.' : 'Reservations are open.');
      else if (isCollectingInterest(result) && result.interested) notify('Interest registered.');
      else notify('This trip is currently unavailable.');
      refreshCatalog().catch(() => {});
    } catch (error) {
      notify(error.message);
      refreshCatalog().catch(() => {});
    }
  };

  const startBooking = async () => {
    try {
      const freshCatalog = await refreshCatalog();
      const available = freshCatalog.trips.some(trip => trip.destination_id === selected.id && isBookableTrip(trip));
      if (!available) return notify('No scheduled trips are currently available');
      bookingAttempt.current = null;
      setBooking({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'chapa' });
      setScreen('trip');
    } catch (error) {
      notify(error.message || 'Could not refresh pickup stations');
    }
  };
  const redirectToCheckout = async (bookingId) => {
    const { checkout_url } = await api('/api/payments/chapa', {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    });
    window.location.assign(checkout_url);
  };
  const finishBooking = async (requestPayment) => {
    if (bookingSubmitting.current) return;
    bookingSubmitting.current = true;
    setSubmitting(true);
    try {
      const details = {
        trip_id: booking.trip.id,
        station_id: booking.pickup.id,
        pickup_address: booking.pickup.is_address_pickup ? booking.pickup.pickup_address.trim() : undefined,
        seats: booking.seats,
        passengers: booking.passengers,
      };
      const draft = JSON.stringify(details);
      if (bookingAttempt.current?.draft !== draft) {
        bookingAttempt.current = { draft, id: crypto.randomUUID() };
      }
      const { booking: created } = await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ ...details, idempotency_key: bookingAttempt.current.id }),
      });
      const scheduledTrip = catalog.trips.find(trip => trip.id === created.trip_id) || booking.trip;
      const reservation = { ...created, scheduled_trip: scheduledTrip };
      setBookedTrips(previous => [
        reservation,
        ...previous.filter(item => item.id !== created.id),
      ]);
      goTab('trips');
      if (requestPayment && canPayBooking(reservation)) {
        await redirectToCheckout(created.id);
      } else {
        notify('Reservation saved. Check My Trips for payment status.');
      }
    } catch (error) {
      notify(error.message);
    } finally {
      bookingSubmitting.current = false;
      setSubmitting(false);
    }
  };
  const openTrip = async (trip) => {
    if (trip.payment_status === 'paid') {
      setBooking(normalizeBookingForUi(trip, liveDestinations));
      setTicketBackScreen(null);
      setScreen('ticket');
      return;
    }
    if (bookingSubmitting.current) return;
    bookingSubmitting.current = true;
    setSubmitting(true);
    try {
      if (canPayBooking(trip)) {
        await redirectToCheckout(trip.id);
      } else if (isAwaitingActivation(trip)) {
        const updated = (await refreshBookings()).find(item => item.id === trip.id);
        if (updated && canPayBooking(updated)) notify('Payment is now available for this trip.');
        else if (updated && isAwaitingActivation(updated)) notify('Payment opens when this trip becomes active.');
        else notify('This reservation is unavailable for payment.');
      }
    } catch (error) {
      notify(error.message);
      refreshBookings().catch(() => {});
    } finally {
      bookingSubmitting.current = false;
      setSubmitting(false);
    }
  };

  const content = () => {
    if (screen === 'detail') return <Detail destination={selected} catalog={catalog} linkedTripId={linkedTripId} back={goBack} book={startBooking} expressInterest={expressInterest} checkTripInterest={checkTripInterest} notify={notify} favorites={favorites} toggleFavorite={toggleFavorite} />;
    if (['trip','pickup','seats','passengers','review'].includes(screen))
      return <BookingFlow step={screen} destination={selected} catalog={catalog} booking={booking} setBooking={setBooking} back={goBack} next={(s) => { setScreen(s); window.scrollTo(0,0); vibrate(); }} finish={finishBooking} submitting={submitting} />;
    if (screen === 'confirmation') return <Confirmation booking={booking} home={() => goTab('home')} ticket={() => { setTicketBackScreen('confirmation'); setScreen('ticket'); }} />;
    if (screen === 'ticket') return <TicketView booking={booking} back={() => setScreen(ticketBackScreen)} />;
    if (screen === 'notifications') return <NotificationsView back={goBack} notifications={profileData.notifications} api={api} onChange={loadProfileData} />;
    if (screen === 'notification_settings') return <NotificationSettingsView back={goBack} preferences={profileData.notification_preferences} api={api} notify={notify} onChange={loadProfileData} />;
    if (screen === 'rewards') return <RewardsView back={goBack} rewards={profileData.rewards} transactions={profileData.reward_transactions} />;
    if (screen === 'coupons') return <CouponsView back={goBack} coupons={profileData.coupons} />;
    if (screen === 'help') return <HelpCenterView back={goBack} />;
    if (screen === 'account') return <MyAccountView user={user} back={goBack} notify={notify} api={api} onUpdated={(updated) => { setUser(updated); loadProfileData().catch(() => {}); }} />;
    if (screen === 'saved') return <SavedDestinationsView destinations={liveDestinations} favorites={favorites} open={openDetail} back={goBack} />;
    if (screen === 'suggest') return <SuggestTripView back={goBack} notify={notify} api={api} />;
    if (screen === 'friends') return <CloseFriendsView back={goBack} friends={profileData.friends} api={api} notify={notify} onChange={loadProfileData} />;
    if (screen === 'refer') return <ReferFriendView back={goBack} notify={notify} code={profileData.referral_code} />;
    if (tab === 'home') return <HomeView user={user} destinations={liveDestinations.length ? liveDestinations : fallbackDestinations} trips={catalog.trips} category={category} setCategory={setCategory} open={openDetail} goSearch={() => goTab('search')} openNotifications={() => setScreen('notifications')} />;
    if (tab === 'search') return <SearchView destinations={liveDestinations} query={query} setQuery={setQuery} open={openDetail} />;
    if (tab === 'trips') return <TripsView destinations={liveDestinations} trips={bookedTrips} open={openTrip} explore={() => goTab('home')} submitting={submitting} />;
    if (tab === 'map') return <MapView destinations={liveDestinations} open={openDetail} back={() => goTab('home')} />;
    return <ProfileView user={user} open={(s) => setScreen(s)} notify={notify} api={api} />;
  };

  if (authStatus !== 'authenticated') {
    return <AuthGate status={authStatus} error={authError} retry={authenticate} />;
  }
  const hideTabs = Boolean(screen);
  return (
    <main className="app-shell">
      {content()}
      {!hideTabs && <nav className="bottom-nav">
        {tabs.map(([id, Icon, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => goTab(id)}><Icon size={22}/><span>{label}</span></button>)}
      </nav>}
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </main>
  );
}

function normalizeDestination(destination) {
  return {
    ...destination,
    rating: Number(destination.rating || 0),
    reviews: Number(destination.review_count || destination.reviews || 0),
    price: Number(destination.price || 0),
    duration: destination.estimated_duration ? `${destination.estimated_duration} days` : destination.duration || '',
    image: destination.images?.[0] || fallbackDestinations[Math.abs(String(destination.id).length) % fallbackDestinations.length].image,
    coordinates: destinationCoordinates(destination),
  };
}

function normalizeBookingForUi(item, destinations) {
  const destination = destinations.find(candidate => String(candidate.id) === String(item.destination_id)) || {
    name: item.destination_name || 'Tankua Trip',
    image: item.destination_image || fallbackDestinations[0].image,
  };
  const departure = item.scheduled_trip?.departure_date;
  const rawDate = departure || item.departure_date || item.date || item.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const dateStr = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    : (typeof rawDate === 'string' ? rawDate : 'Upcoming');
  return {
    ...item,
    destination: {
      ...destination,
      name: item.destination_name || destination.name,
      image: item.destination_image || destination.image,
    },
    trip: {
      date: dateStr,
      time: departure && dateObj && !Number.isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : item.departure_time || item.pickup_time || '06:00 AM',
    },
    pickup: item.pickup || item.pickup_station || { name: item.pickup_name || 'Pickup station' },
    total: Number(item.total_price || 0),
  };
}

function AuthGate({ status, error, retry }) {
  const loading = status === 'loading';
  const telegramRequired = status === 'telegram-required';
  if (loading) return <main className="auth-splash" aria-label="Tankua is loading">
    <img src="/android-adaptive-icon.png" alt="Tankua"/>
  </main>;
  return <main className="auth-gate">
    <div className="auth-brand">
      <img src="/tankua-logo.png" alt="Tankua"/>
      <div><strong>TANKUA</strong><span>Explore Ethiopia</span></div>
    </div>
    <section className="auth-panel">
      <p className="eyebrow">{telegramRequired ? 'TELEGRAM MINI APP' : 'SIGN-IN INTERRUPTED'}</p>
      <h1>{telegramRequired ? 'Continue in Telegram' : 'Let’s get you back in'}</h1>
      <p>{telegramRequired ? 'Launch Tankua from the official bot to sign in securely—no password needed.' : error}</p>
      {telegramRequired && <a href="https://t.me/tankua_tma_bot" target="_blank" rel="noreferrer">Open @tankua_tma_bot</a>}
      {status === 'error' && <button onClick={retry}>Try secure sign-in again</button>}
      <div className={`auth-trust ${status === 'error' ? 'error' : ''}`}>
        <ShieldCheck/>
        <span><b>{status === 'error' ? 'Your account is safe' : 'Protected by Telegram'}</b>{status === 'error' ? 'No account data was accepted.' : 'Password-free, verified access.'}</span>
      </div>
    </section>
    <WeekendPlannerLink />
    <p className="auth-foot">Travel farther. Feel at home.</p>
  </main>;
}

function WeekendPlannerLink() {
  const openInTelegramBrowser = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.initData || typeof webApp.openLink !== 'function') return;

    try {
      webApp.openLink(WEEKEND_PLANNER_URL);
      event.preventDefault();
    } catch {
      // The anchor opens a browser tab if the Telegram client rejects the request.
    }
  };

  return (
    <a
      className="weekend-planner-link"
      href={WEEKEND_PLANNER_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={openInTelegramBrowser}
    >
      <span className="weekend-planner-link-icon"><CalendarDays size={21} aria-hidden="true" /></span>
      <span className="weekend-planner-link-copy">
        <strong>Plan your weekend</strong>
        <span>Addis outings, events and group plans</span>
      </span>
      <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}

const ALL_CATEGORIES = [
  'All', 'Adventure', 'Cultural', 'Medical', 'Religious', 'Ecotourism',
  'Business', 'Wildlife', 'Cruise', 'Rural', 'Sports', 'Shopping',
  'Wellness', 'Dark', 'Budget', 'Culinary', 'Luxury', 'Voluntourism',
  'Space', 'Accessible', 'Agritourism', 'Photography', 'Ancestry',
  'Educational', 'Urban', 'Historical', 'Nature', 'Sacred', 'Monument',
  'Park', 'Museum', 'City', 'Other'
];

function HomeView({ user, destinations, trips, category, setCategory, open, goSearch, openNotifications }) {
  const featured = destinations.filter(destination => destination.is_featured);
  const popular = destinations.filter(destination => destination.is_popular).slice(0, 6);
  const interestDestinations = new Set(trips.filter(isCollectingInterest).map(trip => trip.destination_id));
  const collectingInterest = destinations.filter(destination => interestDestinations.has(destination.id));

  return <div className="page home-page">
    <header className="home-header">
      <h1>Explore <em>Ethiopia</em></h1>
      <button className="icon-button" aria-label="Notifications" onClick={openNotifications}>
        <Bell size={20}/>
        <i/>
      </button>
    </header>
    <button className="search-bar" onClick={goSearch}>
      <span className="search-icon"><Search size={18}/></span>
      <span><b>Find a destination</b><small>Search places, cities and experiences</small></span>
      <i className="search-go"><ChevronRight/></i>
    </button>
    <WeekendPlannerLink />
    <div className="chips">
      {ALL_CATEGORIES.slice(0, 16).map(c => <button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}
    </div>
    {featured.length > 0 && <>
      <SectionHeader title="Featured" />
      <div className="featured-row">{featured.map(d => <DestinationHero key={d.id} d={d} open={open}/>)}</div>
    </>}
    {popular.length > 0 && <>
      <SectionHeader title="Popular destinations" action="See all" onAction={goSearch}/>
      <div className="destination-grid">{popular.map(d => <DestinationCard key={d.id} d={d} open={open}/>)}</div>
    </>}
    {collectingInterest.length > 0 && (
      <section>
        <SectionHeader title="Planned departures" />
        <div className="interest-destinations">
          {collectingInterest.map(destination => (
            <button className="interest-destination" key={destination.id} type="button" onClick={() => open(destination)}>
              <UsersRound aria-hidden="true" />
              <span>{destination.name}</span>
              <ChevronRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    )}
    <section className="how">
      <SectionHeader title="How it works"/>
      {[['01','Choose destination','Find a place that inspires you.'],['02','Select your trip','Pick a date, pickup and seats.'],['03','Book & pay','Pay securely and get your QR ticket.']].map(x=><div className="how-row" key={x[0]}><b>{x[0]}</b><div><strong>{x[1]}</strong><p>{x[2]}</p></div></div>)}
    </section>
  </div>;
}

function SectionHeader({ title, action, onAction }) { return <div className="section-head"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}</button>}</div>; }
function DestinationHero({d,open}) { return <button className="hero-card" onClick={()=>open(d)} style={{backgroundImage:`linear-gradient(180deg,transparent 35%,rgba(5,15,28,.88) 100%),url("${d.image}")`}}><div className="hero-content"><h3>{d.name}</h3><p className="hero-location"><MapPin size={13}/>{d.city}</p><div className="hero-meta"><span className="hero-rating"><Star size={13} fill="#ffb800" color="#ffb800"/> {d.rating}</span>{d.price ? <b className="hero-price">From {money(d.price, d.currency)}</b> : null}</div></div></button>; }
function DestinationCard({d,open}) { return <button className="destination-card" onClick={()=>open(d)}><div className="card-image" style={{backgroundImage:`url("${d.image}")`}}><span>{d.category}</span><Heart size={18}/></div><div className="card-copy"><h3>{d.name}</h3><p><MapPin size={13}/>{d.city}</p><div><span><Star size={13} fill="currentColor"/> {d.rating}</span>{d.price ? <b>{money(d.price, d.currency)}</b> : null}</div></div></button>; }

function Detail({ destination:d, catalog, linkedTripId, back, book, expressInterest, checkTripInterest, notify, favorites = [], toggleFavorite }) {
  const destinationTrips = catalog.trips.filter(trip => trip.destination_id === d.id);
  const bookableTrips = destinationTrips.filter(isBookableTrip);
  const interestTrips = destinationTrips.filter(isCollectingInterest);
  const destinationTrip = bookableTrips[0];
  const provider=(catalog.providers||[]).find(item=>item.id===destinationTrip?.provider_id);
  const pricedTrips = bookableTrips.filter(trip => trip.price != null && Number.isFinite(Number(trip.price)));
  const currencies = new Set(pricedTrips.map(trip => tripCurrency(trip.currency)));
  const startingCurrency = currencies.size === 1 ? currencies.values().next().value : null;
  const startingPrice = startingCurrency ? Math.min(...pricedTrips.map(trip => Number(trip.price))) : null;
  const isFavorite = favorites.includes(d.id);

  useEffect(() => {
    if (!linkedTripId) return;
    const card = document.getElementById(`trip-interest-${linkedTripId}`);
    card?.scrollIntoView({ block: 'center' });
    card?.focus({ preventScroll: true });
  }, [linkedTripId]);

  const handleShare = async () => {
    const shareText = `Check out ${d.name} in ${d.city}, Ethiopia on Tankua!`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: d.name,
          text: shareText,
          url: shareUrl,
        });
        notify('Shared successfully!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // User cancelled or failed
        }
      }
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        notify('Trip link copied to clipboard! 📋');
      } else {
        notify('Trip link ready to share!');
      }
    } catch (e) {
      notify('Trip link copied to clipboard! 📋');
    }
  };

  return <div className="detail-page">
    <div className="detail-hero" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.35),transparent 40%,rgba(5,15,28,.85)),url("${d.image}")`}}>
      <div className="floating-head">
        <button onClick={back} aria-label="Go back"><ArrowLeft size={20}/></button>
        <div>
          <button onClick={() => toggleFavorite ? toggleFavorite(d.id) : notify('Saved to favorites')} aria-label="Favorite destination">
            <Heart size={20} fill={isFavorite ? '#ff6b6b' : 'none'} color={isFavorite ? '#ff6b6b' : 'currentColor'}/>
          </button>
          <button onClick={handleShare} aria-label="Share destination"><Share2 size={20}/></button>
        </div>
      </div>
      <div className="detail-title"><span>{d.category}</span><h1>{d.name}</h1><p><MapPin size={15}/>{d.city}, {d.region}</p></div>
    </div>
    <div className="detail-content">
      {interestTrips.length > 0 && (
        <section className="interest-trips">
          <h2>Planned departures</h2>
          <p className="body-copy">Reservations open once the minimum group size is met.</p>
          {interestTrips.map(trip => (
            <InterestTripCard
              key={trip.id}
              trip={trip}
              provider={catalog.providers.find(item => item.id === trip.provider_id)}
              expressInterest={expressInterest}
              checkTripInterest={checkTripInterest}
            />
          ))}
        </section>
      )}
      <div className="quick-facts"><div><Star/><b>{d.rating}</b><span>{d.reviews} reviews</span></div><div><Clock3/><b>{d.duration}</b><span>Duration</span></div><div><ShieldCheck/><b>Verified</b><span>Tankua partner</span></div></div>
      <h2>About this place</h2><p className="body-copy">{d.description}</p>
      {destinationTrip && <><h2>What’s included</h2><div className="included"><span><Check/>Round-trip transport</span><span><Check/>Professional guide</span><span><Check/>Entrance fees</span><span><Check/>24/7 trip support</span></div></>}
      {provider&&<div className="provider">{provider.logo_url?<img className="provider-logo-image" src={provider.logo_url} alt={`${provider.name} logo`}/>:<div className="provider-logo"><Building2/></div>}<div><small>OPERATED BY</small><b>{provider.name}</b><p>{Number(provider.rating||0).toFixed(1)} ★ · Verified provider</p></div><ChevronRight/></div>}
      {!bookableTrips.length && !interestTrips.length && <p className="body-copy">No scheduled trips are currently available.</p>}
    </div>
    {bookableTrips.length > 0 && (
      <div className="sticky-cta">
        <div>{startingPrice !== null && <><span>Starting from</span><b>{money(startingPrice, startingCurrency)}</b><small>per person</small></>}</div>
        <button onClick={book}>View bookable trips <ChevronRight size={18}/></button>
      </div>
    )}
  </div>;
}

function InterestTripCard({ trip, provider, expressInterest, checkTripInterest }) {
  const [pending, setPending] = useState(false);
  const departure = new Date(trip.departure_date);
  const departureLabel = departure.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleAction = async () => {
    setPending(true);
    try {
      await (trip.interested ? checkTripInterest(trip.id) : expressInterest(trip));
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="interest-trip" id={`trip-interest-${trip.id}`} tabIndex={-1}>
      <div className="interest-trip-heading">
        <div>
          <h3>{departureLabel}</h3>
          {provider && <p>{provider.name}</p>}
        </div>
        {trip.price != null && <b>{money(trip.price, trip.currency)} <small>per person</small></b>}
      </div>
      {trip.summary && <p className="interest-trip-summary">{trip.summary}</p>}
      <div className="interest-trip-action">
        <small>{trip.interested ? 'Interest registered' : 'Free to register'}</small>
        <button type="button" disabled={pending} onClick={handleAction}>
          {pending ? 'Updating…' : trip.interested ? 'Check status' : 'Register interest'}
        </button>
      </div>
    </article>
  );
}

function FlowHeader({ step, back }) {
  const steps = ['trip','pickup','seats','passengers','review']; const index=steps.indexOf(step);
  return <><header className="flow-head"><button onClick={back}><ArrowLeft/></button><div><span>STEP {index+1} OF 5</span><b>{['Select trip','Pickup station','Choose seats','Passenger details','Review booking'][index]}</b></div></header><div className="progress"><i style={{width:`${(index+1)*20}%`}}/></div></>;
}
function BookingFlow({ step, destination, catalog, booking, setBooking, back, next, finish, submitting }) {
  const trips = catalog.trips.filter(trip => trip.destination_id === destination.id && isBookableTrip(trip)).map(trip => {
    const departure = new Date(trip.departure_date);
    const arrival = trip.return_date ? new Date(trip.return_date) : null;
    return {
      ...trip,
      time: departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      arrival: arrival ? arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      date: departure.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      label: trip.trip_type === 'private' ? 'Private trip' : trip.trip_type === 'holiday' ? 'Holiday departure' : 'Group trip',
      left: Number(trip.available_seats || 0),
    };
  });
  const linkByStation = new Map(catalog.trip_pickup_stations.filter(link => link.trip_id === booking.trip?.id).map(link => [link.station_id, link]));
  const pickups = catalog.stations.filter(station => linkByStation.has(station.id)).map(station => {
    const link = linkByStation.get(station.id);
    return { ...station, sub: station.is_address_pickup ? [station.city, station.address].filter(Boolean).join(' / ') : station.address || station.city || '', time: link.pickup_time, extraPrice: Number(link.extra_price || 0) };
  });
  if(step==='trip') return <TripStep destination={destination} trips={trips} providers={catalog.providers||[]} booking={booking} setBooking={setBooking} back={back} next={()=>next('pickup')}/>;
  if(step==='pickup') return <PickupStep pickups={pickups} booking={booking} setBooking={setBooking} back={back} next={()=>next('seats')}/>;
  if(step==='seats') return <SeatStep destination={destination} booking={booking} setBooking={setBooking} back={back} next={()=>next('passengers')}/>;
  if(step==='passengers') return <PassengerForm step={step} back={back} booking={booking} setBooking={setBooking} next={()=>next('review')}/>;
  const currentTrip = trips.find(trip => trip.id === booking.trip?.id);
  return <ReviewBooking back={back} destination={destination} booking={booking} trip={currentTrip} finish={finish} submitting={submitting}/>;
}
function FlowPage({step,back,title,sub,children}) { return <div className="flow-page"><FlowHeader step={step} back={back}/><div className="flow-body"><h1>{title}</h1><p className="lead">{sub}</p>{children}</div></div>; }
function Choice({selected,onClick,children}) { return <button className={`choice ${selected?'selected':''}`} onClick={onClick}>{children}<i className="radio">{selected&&<Check/>}</i></button>; }
function Continue({disabled,onClick,label='Continue'}) { return <button className="continue" disabled={disabled} onClick={onClick}>{label}<ChevronRight/></button>; }

function TripStep({destination,trips,providers,booking,setBooking,back,next}) {
  const providerById=new Map(providers.map(provider=>[provider.id,provider]));
  const durationLabel=(minutes)=>{const value=Number(minutes||0);if(!value)return '';const hours=Math.floor(value/60),mins=value%60;return [hours?`${hours} hr${hours===1?'':'s'}`:'',mins?`${mins} min`:''].filter(Boolean).join(' ');};
  return <FlowPage step="trip" back={back} title="Select Trip" sub={`Available trips to ${destination.name}`}>
    <div className="mobile-trip-list">{trips.map(trip=>{
      const provider=providerById.get(trip.provider_id);
      const selected=booking.trip?.id===trip.id;
      return <button key={trip.id} className={`mobile-trip-card ${selected?'selected':''}`} onClick={()=>setBooking({...booking,trip,pickup:null,seats:1,passengers:[]})}>
        {provider&&<div className="trip-provider">{provider.logo_url?<img src={provider.logo_url} alt={`${provider.name} logo`}/>:<span><Building2/></span>}<div><small className="provider-eyebrow">OPERATED BY</small><b>{provider.name}</b><small><Star fill="currentColor"/>{Number(provider.rating||0).toFixed(1)} · Verified provider</small></div>{selected&&<Check/>}</div>}
        <div className="trip-schedule"><div><span>DEPARTURE</span><b>{trip.date}</b><small>{trip.time}</small></div><i><Bus/><span>{String(trip.trip_type||'scheduled').split('_').join(' ')}</span></i>{trip.return_date?<div><span>RETURN</span><b>{new Date(trip.return_date).toLocaleDateString([],{month:'short',day:'numeric'})}</b><small>{trip.arrival}</small></div>:<div><span>TRIP</span><b>One way</b><small>Scheduled</small></div>}</div>
        <div className="trip-card-foot"><span><UsersRound/>{trip.left} seats available</span><b>{money(trip.price, trip.currency)} <small>/ seat</small></b></div>
        {selected&&<div className="trip-details">
          {trip.summary&&<p className="trip-summary">{trip.summary}</p>}
          {(trip.duration_minutes||trip.transportation_type||trip.difficulty_level)&&<div className="trip-detail-facts">
            {trip.duration_minutes&&<span><Clock3/><small>Duration</small><b>{durationLabel(trip.duration_minutes)}</b></span>}
            {trip.transportation_type&&<span><Bus/><small>Transport</small><b>{trip.transportation_type}</b></span>}
            {trip.difficulty_level&&<span><UsersRound/><small>Activity</small><b>{trip.difficulty_level}</b></span>}
          </div>}
          {trip.itinerary&&<section><h4>Itinerary</h4><p>{trip.itinerary}</p></section>}
          {!!trip.inclusions?.length&&<section><h4>What's included</h4><ul>{trip.inclusions.map((item,index)=><li key={index}><Check/>{item}</li>)}</ul></section>}
          {!!trip.exclusions?.length&&<section><h4>Not included</h4><ul>{trip.exclusions.map((item,index)=><li key={index}><X/>{item}</li>)}</ul></section>}
          {trip.meeting_instructions&&<section><h4>Meeting instructions</h4><p>{trip.meeting_instructions}</p></section>}
          {trip.what_to_bring&&<section><h4>What to bring</h4><p>{trip.what_to_bring}</p></section>}
          {trip.cancellation_policy&&<section><h4>Cancellation policy</h4><p>{trip.cancellation_policy}</p></section>}
        </div>}
      </button>;
    })}</div>
    {!trips.length&&<div className="flow-empty"><CalendarDays/><h3>No trips available</h3><p>Please check back later or choose another destination.</p></div>}
    <div className="flow-info"><Info/><span><b>Transparent pricing</b>Tankua adds a 5% service fee at checkout.</span></div>
    <div className="flow-sticky"><Continue disabled={!booking.trip} onClick={next}/></div>
  </FlowPage>;
}

function PickupStep({pickups,booking,setBooking,back,next}) {
  const [view,setView]=useState('list');
  const selected = booking.pickup;
  const canContinue = selected && (!selected.is_address_pickup || selected.pickup_address?.trim().length >= 5);
  const choosePickup = pickup => {
    if (selected?.id !== pickup.id) setBooking({ ...booking, pickup });
  };
  return <FlowPage step="pickup" back={back} title="Select pickup location" sub="Choose your preferred pickup location">
    <div className="view-toggle"><button className={view==='list'?'active':''} onClick={()=>setView('list')}><Navigation/>List</button><button className={view==='map'?'active':''} onClick={()=>setView('map')}><MapIcon/>Map</button></div>
    {view==='list'?<div className="pickup-list">{pickups.map(p=><button key={p.id} className={`pickup-card ${booking.pickup?.id===p.id?'selected':''}`} onClick={()=>choosePickup(p)}><span><MapPin/></span><div><b>{p.name}</b><p>{p.sub}</p><small>Pickup at {p.time}{p.extraPrice>0?` · +${money(p.extraPrice, booking.trip?.currency)}`:' · Included'}</small></div>{booking.pickup?.id===p.id&&<Check/>}</button>)}</div>:<div className="pickup-map"><div className="map-grid"/>{pickups.filter(p=>!p.is_address_pickup).map((p,index)=><button key={p.id} className={`pickup-pin ${booking.pickup?.id===p.id?'selected':''}`} style={{left:`${18+(index*23)%65}%`,top:`${19+(index*29)%62}%`}} onClick={()=>choosePickup(p)}><MapPin fill="currentColor"/><span>{p.name}</span></button>)}</div>}
    {selected?.is_address_pickup && <div className="passenger-card">
      <label>Pickup address in {selected.city}
        <input
          value={selected.pickup_address || ''}
          onChange={event=>setBooking({...booking,pickup:{...selected,pickup_address:event.target.value}})}
          autoComplete="street-address"
          maxLength={240}
          placeholder="Hotel, street address, or nearby landmark"
        />
      </label>
    </div>}
    {!pickups.length&&<div className="flow-empty"><MapPin/><h3>No pickup stations</h3><p>This provider has not added pickup stations for this trip yet.</p></div>}
    <div className="flow-sticky">{booking.pickup&&<div className="selected-pickup"><Check/><span><b>{booking.pickup.name}</b><small>{booking.pickup.time}{booking.pickup.extraPrice>0?` · +${money(booking.pickup.extraPrice, booking.trip?.currency)}`:''}</small></span></div>}<Continue disabled={!canContinue} onClick={next}/></div>
  </FlowPage>;
}

function SeatStep({destination,booking,setBooking,back,next}) {
  const limit=Math.min(8,Number(booking.trip?.left||booking.trip?.available_seats||8));
  return <FlowPage step="seats" back={back} title="Select Seats" sub="How many seats do you need?">
    <div className="seat-picker mobile"><div className="people-art"><UsersRound/></div><div className="counter"><button disabled={booking.seats<=1} onClick={()=>setBooking({...booking,seats:booking.seats-1,passengers:[]})}><Minus/></button><div><b>{booking.seats}</b><span>{booking.seats===1?'seat':'seats'}</span></div><button disabled={booking.seats>=limit} onClick={()=>setBooking({...booking,seats:booking.seats+1,passengers:[]})}><Plus/></button></div><p>{limit} currently available · {money(booking.trip?.price ?? destination.price, booking.trip?.currency ?? destination.currency)} each</p></div>
    <PriceSummary d={destination} booking={booking}/>
    <div className="flow-info"><Info/><span><b>Passenger details come next</b>We need a name and age for every traveler.</span></div>
    <div className="flow-sticky"><Continue onClick={next}/></div>
  </FlowPage>;
}
function bookingPrices(booking, destination) {
  const currency = tripCurrency(booking.trip?.currency ?? destination.currency);
  const perSeat = Number(booking.trip?.price ?? destination.price);
  const subtotal = perSeat * booking.seats;
  const pickupFee = Number(booking.pickup?.extraPrice || 0);
  const base = subtotal + pickupFee;
  const baseCents = Math.round(base * 100);
  const feeCents = Math.round(baseCents * 5 / 100);
  const fee = currency === 'USD' ? feeCents / 100 : Math.round(base * 0.05);
  const total = currency === 'USD' ? (baseCents + feeCents) / 100 : base + fee;
  return { currency, perSeat, subtotal, pickupFee, fee, total };
}

function PriceSummary({ prices, seats }) {
  const { currency, perSeat, subtotal, pickupFee, fee, total } = prices;
  return <div className="summary">
    <h3>Estimated price</h3>
    <p><span>{money(perSeat, currency)} ? {seats}</span><b>{money(subtotal, currency)}</b></p>
    {pickupFee > 0 && <p><span>Pickup supplement</span><b>{money(pickupFee, currency)}</b></p>}
    <p><span>Service fee</span><b>{money(fee, currency)}</b></p>
    <hr/>
    <p className="total"><span>Total</span><b>{money(total, currency)}</b></p>
    <small>Final price is recalculated securely when you book.</small>
  </div>;
}
function PassengerForm({step,back,booking,setBooking,next}) {
  const [people,setPeople]=useState(()=>Array.from({length:booking.seats},(_,i)=>booking.passengers[i]||{name:'',age:''}));
  const update=(i,k,v)=>setPeople(current=>current.map((person,index)=>index===i?{...person,[k]:v}:person));
  const valid=people.every(p=>p.name.trim()&&p.age);
  return <FlowPage step={step} back={back} title="Who’s traveling?" sub="Enter passenger details exactly as shown on an ID.">{people.map((p,i)=><div className="passenger-card" key={i}><h3><UserRound/> Passenger {i+1}{i===0&&<span>Primary</span>}</h3><label>Full name<input value={p.name} onChange={e=>update(i,'name',e.target.value)} placeholder="Full legal name"/></label><label>Age<input inputMode="numeric" value={p.age} onChange={e=>update(i,'age',e.target.value.replace(/\\D/g,''))} placeholder="Age"/></label></div>)}<Continue disabled={!valid} onClick={()=>{setBooking({...booking,passengers:people});next()}}/></FlowPage>;
}
function ReviewBooking({back,destination,booking,trip,finish,submitting}) {
  if (!trip) {
    return <FlowPage step="review" back={back} title="Trip unavailable" sub="Go back to select an available trip."/>;
  }
  const requestPayment = trip.status === 'active';
  const prices = bookingPrices({ ...booking, trip }, destination);
  const label = submitting ? (requestPayment ? 'Creating secure checkout…' : 'Reserving seats…')
    : (requestPayment ? `Continue · ${money(prices.total, prices.currency)}` : 'Reserve seats');
  return (
    <FlowPage
      step="review"
      back={back}
      title={requestPayment ? 'Secure payment' : 'Reserve your seats'}
      sub={requestPayment ? 'You’ll continue to Chapa’s encrypted checkout.' : 'Pay from My Trips once the trip becomes active.'}
    >
      {requestPayment && <>
        <div className="secure-note"><ShieldCheck/><span><b>Server-verified checkout</b>Price and seat availability are checked again before payment.</span></div>
        <Choice selected><div className="pay-logo chapa"><img src="/chapa-logo.svg" alt="Chapa"/></div><div className="pay-copy"><b>Chapa</b><p>{prices.currency === 'USD' ? 'US dollar checkout' : 'Card, bank or mobile money'}</p></div></Choice>
      </>}
      <PriceSummary prices={prices} seats={booking.seats}/>
      <Continue disabled={submitting} onClick={() => finish(requestPayment)} label={label}/>
    </FlowPage>
  );
}

function Confirmation({booking,home,ticket}) {
  return <div className="confirmation">
    <div className="success-orbit"><span><Check/></span></div>
    <p className="eyebrow">BOOKING CONFIRMED</p>
    <h1>You’re going to<br/>{booking.destination.name}!</h1>
    <p className="confirmation-message">Your trip is reserved. We’ve added your ticket to the Trips tab.</p>
    <div className="confirmation-card">
      <img src={booking.destination.image} alt=""/>
      <div><b>{booking.destination.name}</b><span><CalendarDays/>{booking.trip.date} · {booking.trip.time}</span><span><MapPin/>{booking.pickup.pickup_address || booking.pickup.name}</span><span><UsersRound/>{booking.seats} traveler{booking.seats>1?'s':''}</span></div>
      <strong>{booking.id}</strong>
    </div>
    <button className="continue" onClick={ticket}>View QR ticket <Ticket/></button>
    <button className="text-button" onClick={home}>Back to home</button>
  </div>;
}
function TripReviewForm({bookingId}) {
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await api('/api/bookings/' + bookingId + '/review', {
        method: 'POST', body: JSON.stringify({ rating: Number(rating), comment }),
      });
      setSent(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return sent ? <p role="status">Review submitted.</p> : (
    <form className="passenger-card" onSubmit={submit}>
      <h3>Rate your trip</h3>
      <label>Rating<select value={rating} onChange={event=>setRating(event.target.value)}>
        {[5,4,3,2,1].map(score=><option key={score} value={score}>{score} / 5</option>)}
      </select></label>
      <label>Comment<input maxLength={1000} value={comment} onChange={event=>setComment(event.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button className="continue" disabled={pending} type="submit">Send review</button>
    </form>
  );
}

function TicketView({booking,back}) {
  const [qrImage,setQrImage]=useState('');
  const [shareStatus,setShareStatus]=useState('');
  const receipt = bookingTab(booking) !== 'upcoming' || Date.parse(booking.scheduled_trip?.departure_date) <= Date.now();
  const ticketCode=`TANKUA|BOOKING|${booking.id}`;
  useEffect(()=>{
    if (receipt) return;
    let active=true;
    QRCode.toDataURL(ticketCode,{errorCorrectionLevel:'H',margin:2,width:640,color:{dark:'#081a2cff',light:'#ffffffff'}})
      .then(image=>{if(active)setQrImage(image);})
      .catch(()=>{if(active)setShareStatus('Could not generate the ticket QR.');});
    return()=>{active=false;};
  },[ticketCode,receipt]);
  const shareTicket=async()=>{
    const text=`Tankua ticket for ${booking.destination.name}\n${booking.trip.date} at ${booking.trip.time}\nBooking: ${booking.id}`;
    try {
      if(qrImage&&navigator.share){
        const blob=await (await fetch(qrImage)).blob();
        const file=new File([blob],`tankua-ticket-${String(booking.id).slice(0,8)}.png`,{type:'image/png'});
        if(!navigator.canShare||navigator.canShare({files:[file]})){
          await navigator.share({title:'My Tankua ticket',text,files:[file]});
          setShareStatus('Ticket shared.');
          return;
        }
        await navigator.share({title:'My Tankua ticket',text});
        setShareStatus('Ticket details shared.');
        return;
      }
      const shareUrl=`https://t.me/share/url?url=${encodeURIComponent('https://t.me/tankua_tma_bot')}&text=${encodeURIComponent(text)}`;
      if(window.Telegram?.WebApp?.openTelegramLink)window.Telegram.WebApp.openTelegramLink(shareUrl);
      else window.open(shareUrl,'_blank','noopener,noreferrer');
    } catch(error) {
      if(error?.name!=='AbortError')setShareStatus('Sharing is not available on this device.');
    }
  };
  return <div className="ticket-page">
    <header className="simple-head"><button onClick={back} aria-label="Back"><ArrowLeft/></button><h1>{receipt ? 'Your receipt' : 'Your ticket'}</h1><span/></header>
    <main className="ticket-page-body">
      <div className="ticket-card">
        <div className="ticket-top"><img src="/tankua-logo.png" alt="Tankua"/><span><b>TANKUA</b><small>EXPLORE ETHIOPIA</small></span></div>
        <div className="ticket-destination" style={{backgroundImage:`linear-gradient(180deg,transparent 20%,rgba(5,15,28,.9)),url("${booking.destination.image}")`}}><div><h2>{booking.destination.name}</h2><p>{booking.trip.date}</p></div></div>
        <div className="ticket-info">
          <div className="ticket-info-row"><span><small>Departure</small><b>{booking.trip.time}</b></span><span><small>Seats</small><b>{booking.seats}</b></span></div>
          <div className="ticket-info-row"><span><small>Pickup</small><b>{booking.pickup.pickup_address || booking.pickup.name}</b></span><span><small>Booking</small><b className="ticket-booking-id">{booking.id}</b></span></div>
          {booking.total > 0 && <div className="ticket-info-row"><span><small>Total paid</small><b>{money(booking.total, booking.currency)}</b></span></div>}
          {!receipt && <div className="qr">{qrImage?<img className="qr-code-image" src={qrImage} alt={`QR code for booking ${booking.id}`}/>:<div className="qr-loading" aria-label="Generating QR code"/>}<small>Scan to read booking {String(booking.id).slice(0,8).toUpperCase()}</small></div>}
        </div>
      </div>
      <div className="ticket-actions"><button className="continue" onClick={shareTicket} disabled={!receipt && !qrImage}><Share2/> {receipt ? 'Share receipt' : 'Share ticket'}</button>{shareStatus&&<p role="status">{shareStatus}</p>}</div>
      {!receipt && <div className="info-note ticket-note"><Info/><p><b>Ready for your trip?</b><span>Arrive 15 minutes before departure with a valid ID.</span></p></div>}
      {booking.status === 'completed' && booking.payment_status === 'paid' && <TripReviewForm bookingId={booking.id} />}
    </main>
  </div>;
}

function SearchView({destinations,query,setQuery,open}) {
  const [selectedCat, setSelectedCat] = useState('All');
  const cleanQuery = query.trim().toLowerCase();

  const list = destinations.filter(d => {
    const matchesCategory = selectedCat === 'All' || (d.category || '').toLowerCase() === selectedCat.toLowerCase();
    const matchesSearch = !cleanQuery || `${d.name} ${d.city} ${d.category} ${d.region}`.toLowerCase().includes(cleanQuery);
    return matchesCategory && matchesSearch;
  });

  return <div className="page search-page">
    <header className="search-hero">
      <div>
        <p className="eyebrow">DISCOVER ETHIOPIA</p>
        <h1 className="search-title">Find a place you’ll <em>love.</em></h1>
      </div>
    </header>
    <label className="search-input">
      <Search size={18}/>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places or cities" autoComplete="off" enterKeyHint="search"/>
      {query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery('')}><X size={15}/></button>}
    </label>
    <div className="chips" style={{ marginTop: '14px', marginBottom: '14px' }}>
      {ALL_CATEGORIES.map(c => <button key={c} className={selectedCat===c?'selected':''} onClick={()=>setSelectedCat(c)}>{c}</button>)}
    </div>
    {!cleanQuery&&<div className="search-suggestions"><span>Try</span>{['Lalibela','Gondar','Nature','Adventure'].map(item=><button key={item} onClick={()=>setQuery(item)}>{item}</button>)}</div>}
    <div className="result-head"><b>{cleanQuery||selectedCat!=='All'?`${list.length} match${list.length===1?'':'es'}`:'Places for you'}</b><span>{cleanQuery||selectedCat!=='All'?'Filtered results':'Handpicked by Tankua'}</span></div>
    {list.length?<div className="search-list">{list.map(d=><button key={d.id} onClick={()=>open(d)}><div className="search-thumb"><img src={d.image} alt={d.name}/><span>{d.category}</span></div><div className="search-copy"><h3>{d.name}</h3><p><MapPin size={12}/>{d.city}</p><div><span><Star size={12} fill="#ffb800" color="#ffb800"/>{d.rating||'New'}</span>{d.price ? <b>From {money(d.price, d.currency)}</b> : null}</div></div><i><ChevronRight size={16}/></i></button>)}</div>:<div className="search-empty"><span>🧭</span><h2>No journeys found</h2><p>Try another place, city, or experience.</p><button onClick={()=>{setQuery('');setSelectedCat('All');}}>Show all places</button></div>}
  </div>;
}
function bookingTab(booking) {
  if (['cancelled', 'canceled'].includes(booking.status) || booking.scheduled_trip?.status === 'cancelled') return 'cancelled';
  if (booking.status === 'completed') return 'completed';
  const schedule = booking.scheduled_trip;
  const departing = Date.parse(schedule?.departure_date);
  const revised = Date.parse(schedule?.revised_end_at);
  const returning = Date.parse(schedule?.return_date);
  const ending = Number.isFinite(revised) ? revised : returning > departing ? returning :
    Number.isFinite(departing) ? departing + (schedule?.duration_minutes || 0) * 60000 :
    Date.parse(booking.date ? booking.date + 'T23:59:59+03:00' : '');
  return ending <= Date.now() ? 'completed' : 'upcoming';
}

function TripsView({trips,destinations,open,explore,submitting}) {
  const [filter,setFilter]=useState('upcoming');
  const filtered=trips.filter(trip=>bookingTab(trip)===filter);
  const labels={upcoming:'Upcoming',completed:'Past',cancelled:'Cancelled'};
  const upcomingCount=trips.filter(trip=>bookingTab(trip)==='upcoming').length;
  return <div className="page trips-page"><header className="trips-hero">
      <div className="trips-hero-icon"><Bus/></div>
      <div className="trips-hero-copy"><p className="eyebrow">YOUR JOURNEYS</p><h1>My trips</h1><span>Tickets, pickup details and travel plans</span></div>
      <div className="trips-count"><b>{upcomingCount}</b><span>Upcoming</span></div>
    </header>
    <div className="segmented">
      {['upcoming','completed','cancelled'].map(item=><button key={item} className={filter===item?'active':''} onClick={()=>{setFilter(item);vibrate();}}>{labels[item]}</button>)}
    </div>
    {filtered.length ? filtered.map(raw => {
      const booking = normalizeBookingForUi(raw, destinations);
      const paid = raw.payment_status === 'paid';
      const awaitingActivation = isAwaitingActivation(raw);
      const canPay = canPayBooking(raw);
      let status = 'Payment unavailable';
      if (filter === 'cancelled') status = raw.payment_status === 'refunded' ? 'Refunded' :
        paid && (raw.expired_at || raw.scheduled_trip?.closeout_reason === 'did_not_run') ? 'Refund review' :
        raw.expired_at ? 'Reservation expired' : 'Cancelled';
      else if (filter === 'completed') status = raw.status === 'completed' ? 'Trip completed' :
        paid ? 'Awaiting provider confirmation' : 'Payment under review';
      else if (paid) status = 'Paid · confirmed';
      else if (awaitingActivation) status = 'Reserved · awaiting trip activation';
      else if (canPay) status = 'Payment pending';

      const action = paid ? (filter === 'upcoming' ? 'View ticket' : 'View receipt') : canPay ? 'Complete payment' : awaitingActivation ? 'Check status' : null;
      const card = <>
        <img src={booking.destination.image} alt=""/>
        <div>
          <span>{status}</span>
          <h3>{booking.destination.name}</h3>
          {raw.scheduled_trip?.revised_end_at && filter === 'upcoming' && <p><Clock3/>Revised end {new Date(raw.scheduled_trip.revised_end_at).toLocaleString('en-GB', {timeZone:'Africa/Addis_Ababa', dateStyle:'medium', timeStyle:'short'})} EAT</p>}
          <p><CalendarDays/>{booking.trip.date} · {booking.trip.time}</p>
          <p><MapPin/>{booking.pickup.pickup_address || booking.pickup.name}</p>
          {booking.total > 0 && <p>{money(booking.total, booking.currency)}</p>}
          {action && <b>{action} <ChevronRight/></b>}
        </div>
      </>;
      return action
        ? <button className="booked-card" onClick={() => open(raw)} disabled={submitting} key={booking.id}>{card}</button>
        : <article className="booked-card" key={booking.id}>{card}</article>;
    }) : <div className="empty"><span><Bus/></span><h2>No {labels[filter].toLowerCase()} trips</h2><p>{filter==='upcoming'?'Your next adventure is waiting. Book a trip and it will show up here.':`Your ${labels[filter].toLowerCase()} journeys will appear here.`}</p>{filter==='upcoming'&&<button onClick={explore}>Explore destinations</button>}</div>}
  </div>;
}

function MapView({destinations,open,back}) {
  const mapElement=useRef(null);
  const mapInstance=useRef(null);
  const markerCluster=useRef(null);
  const markers=useRef([]);
  const userMarker=useRef(null);
  const [selected,setSelected]=useState(null);
  const [query,setQuery]=useState('');
  const [locating,setLocating]=useState(false);
  const [mapReady,setMapReady]=useState(false);

  useEffect(()=>{
    let disposed=false;
    import('leaflet').then(async ({default:L})=>{
      if(disposed||!mapElement.current||mapInstance.current) return;
      await import('leaflet.markercluster');
      if(disposed||!mapElement.current||mapInstance.current) return;
      const map=L.map(mapElement.current,{zoomControl:false,attributionControl:true}).setView([9.03,38.74],6);
      L.control.zoom({position:'bottomright'}).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      markerCluster.current=L.markerClusterGroup({
        maxClusterRadius:45,
        disableClusteringAtZoom:14,
        spiderfyOnMaxZoom:true,
        showCoverageOnHover:false,
        zoomToBoundsOnClick:true,
        removeOutsideVisibleBounds:true,
        iconCreateFunction(cluster){
          const count=cluster.getChildCount();
          const size=count<10?'small':count<100?'medium':'large';
          return L.divIcon({
            html:`<div><span>${count}</span></div>`,
            className:`map-marker-cluster map-marker-cluster-${size}`,
            iconSize:L.point(44,44),
          });
        },
      });
      map.addLayer(markerCluster.current);
      map.on('click',()=>setSelected(null));
      mapInstance.current=map;
      setMapReady(true);
      setTimeout(()=>map.invalidateSize(),100);
    });
    return()=>{disposed=true;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;}markerCluster.current=null;};
  },[]);

  useEffect(()=>{
    if(!mapInstance.current || !mapReady) return;
    let active=true;
    import('leaflet').then(({default:L})=>{
      if(!active||!mapInstance.current)return;
      markerCluster.current?.clearLayers();
      markers.current=[];
      destinations.forEach(item=>{
        const coords=destinationCoordinates(item);
        if(!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return;
        const isSel=selected?.id===item.id;
        const priceNum=Number(item.price||0);
        const priceStr=priceNum ? (priceNum>=1000?`${(priceNum/1000).toFixed(priceNum%1000===0?0:1)}k`:priceNum) : '0';

        const iconHtml=`<div class="map-pin-badge ${isSel?'selected':''}">
          <span class="pin-icon">📍</span>
          ${priceNum ? `<b class="pin-price">${tripCurrency(item.currency)} ${priceStr}</b>` : ''}
        </div>`;

        const customIcon=L.divIcon({
          html:iconHtml,
          className:'map-pin-wrapper',
          iconSize:[68,28],
          iconAnchor:[34,14],
        });

        const marker=L.marker(coords,{icon:customIcon});
        marker.on('click',event=>{
          L.DomEvent.stopPropagation(event);
          setSelected(item);
          mapInstance.current?.flyTo(coords,13,{duration:.7});
          vibrate();
        });
        markerCluster.current?.addLayer(marker);
        markers.current.push(marker);
      });
      if(destinations.length>1 && !selected){
        const validCoords=destinations.map(d=>destinationCoordinates(d)).filter(c=>Number.isFinite(c[0]));
        if(validCoords.length) mapInstance.current.fitBounds(L.latLngBounds(validCoords),{padding:[50,50],maxZoom:9});
      }
    });
    return()=>{active=false;};
  },[destinations,mapReady,selected]);

  const searchMap=(event)=>{
    event.preventDefault();
    const match=destinations.find(destination=>`${destination.name} ${destination.city} ${destination.region}`.toLowerCase().includes(query.trim().toLowerCase()));
    if(match&&mapInstance.current){const coords=destinationCoordinates(match);setSelected(match);if(coords)mapInstance.current.flyTo(coords,13,{duration:.7});}
  };
  const locate=()=>{
    if(!navigator.geolocation||!mapInstance.current)return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async position=>{
      const L=(await import('leaflet')).default;
      const coordinates=[position.coords.latitude,position.coords.longitude];
      mapInstance.current.flyTo(coordinates,12,{duration:.7});
      userMarker.current?.remove();
      userMarker.current=L.circleMarker(coordinates,{radius:8,color:'#fff',weight:3,fillColor:'#1687bd',fillOpacity:1}).addTo(mapInstance.current);
      setLocating(false);
    },()=>setLocating(false),{enableHighAccuracy:true,timeout:10000});
  };

  return <div className="map-page"><div ref={mapElement} className="osm-map"/>
    <div className="map-controls">
      {back && <button type="button" className="map-back-btn" onClick={back} aria-label="Go back"><ArrowLeft size={20}/></button>}
      <form onSubmit={searchMap}><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search destinations"/><button type="submit"><ChevronRight size={18}/></button></form>
      <button className={locating?'locating':''} onClick={locate} aria-label="Use my location"><LocateFixed size={18}/></button>
    </div>
    {selected && (
      <div className="map-card-floating">
        <button type="button" className="map-card-close" onClick={() => setSelected(null)} aria-label="Close destination preview">
          <X size={15} />
        </button>
        <div className="map-card-top">
          <img src={selected.image} alt={selected.name} className="map-card-thumb" />
          <div className="map-card-info">
            <h3>{selected.name}</h3>
            <p className="map-card-location">{selected.city || 'Ethiopia'} · {selected.region || 'Amhara'}</p>
            <div className="map-card-meta">
              <span className="map-card-rating">
                <Star size={12} fill="#ffb800" color="#ffb800" />
                {selected.rating || '4.5'}
              </span>
              <span className="map-card-distance">
                <MapPin size={12} />
                {selected.distance ? `${selected.distance} km` : 'Iconic spot'}
              </span>
            </div>
          </div>
        </div>
        <div className="map-card-actions">
          <button type="button" className="map-card-btn-primary" onClick={() => open(selected)}>
            View Details <ChevronRight size={15} />
          </button>
          <button
            type="button"
            className="map-card-btn-secondary"
            onClick={() => {
              const coords = destinationCoordinates(selected);
              if (coords) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`, '_blank');
              }
            }}
          >
            <Navigation size={14} /> Directions
          </button>
        </div>
      </div>
    )}
  </div>;
}

function MyAccountView({ user, back, notify, api, onUpdated }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    emergency_contact: user?.emergency_contact || '',
    location: user?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoData, setPhotoData] = useState('');
  const photoPreview = photoData || user?.photo_url || user?.profile_photo_url || user?.telegram_photo_url || '';

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      notify('Choose a JPG, PNG, or WebP image under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoData(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone_number) {
      notify('Name and phone number are required');
      return;
    }
    try {
      setLoading(true);
      let updated = user;
      const profile = await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      updated = profile.user;
      if (photoData) {
        const photo = await api('/api/profile/photo', {
          method: 'POST',
          body: JSON.stringify({ data_url: photoData }),
        });
        updated = photo.user;
      }
      onUpdated?.(updated);
      notify('Profile updated successfully');
      back();
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    try {
      setDeleting(true);
      setShowDeleteModal(false);
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete account');
      window.Telegram?.WebApp?.close();
    } catch (e) {
      notify(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>My Account</h1><span/></header>
      <div className="flow-body profile-form">
        <section className="form-section">
          <h3><UserRound size={16}/> Personal Information</h3>
          <label className="profile-photo-picker">
            <span className="profile-photo-preview">
              {photoPreview ? <img src={photoPreview} alt="Profile"/> : (formData.name || 'T').slice(0, 1).toUpperCase()}
            </span>
            <span><b>Profile photo</b><small>Telegram photo is used automatically. Tap to choose your own.</small></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto}/>
          </label>
          <div className="form-group">
            <label>Full Name *</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter your full name" />
          </div>
        </section>
        <section className="form-section">
          <h3><Phone size={16}/> Contact Information</h3>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} placeholder="+251 9XX XXX XXXX" />
          </div>
          <div className="form-group">
            <label>Emergency Contact</label>
            <input type="tel" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} placeholder="Emergency contact phone number" />
          </div>
        </section>
        <section className="form-section">
          <h3><MapPin size={16}/> Location</h3>
          <div className="form-group">
            <label>Address</label>
            <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Your location (city, address)" />
          </div>
        </section>
        <div className="info-note"><Info/><p>Fields marked with * are required. Your information is kept secure and private.</p></div>
        <section className="form-section danger-zone">
          <h3 className="danger-text"><ShieldAlert size={16}/> Danger Zone</h3>
          <div className="danger-card">
            <h4>Delete Account</h4>
            <p>Permanently remove your account and related data from Tankua.</p>
            <button className="btn-danger" disabled={deleting} onClick={handleDelete}>{deleting ? 'Deleting...' : 'Delete Account'}</button>
          </div>
        </section>
      </div>
      <div className="flow-sticky">
        <button className="continue" disabled={loading} onClick={handleSave}>{loading ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <ShieldAlert color="#ef4444" size={24} />
              <h3>Delete Account</h3>
            </div>
            <p className="modal-text">Are you absolutely sure you want to delete your account? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" disabled={deleting} onClick={executeDelete}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavedDestinationsView({ destinations, favorites, open, back }) {
  const saved = destinations.filter(d => favorites.includes(d.id));
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Saved Destinations</h1><span/></header>
      <div className="flow-body">
        {saved.length === 0 ? (
          <div className="empty"><span><Heart size={40}/></span><h2>No saved places</h2><p>You haven't bookmarked any destinations yet.</p></div>
        ) : (
          <div className="destination-grid">{saved.map(d => <DestinationCard key={d.id} d={d} open={open}/>)}</div>
        )}
      </div>
    </div>
  );
}

function SuggestTripView({ back, notify, api }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ origin: '', destination: '', message: '' });
  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api('/api/suggestions', { method: 'POST', body: JSON.stringify(form) });
      notify('Your route suggestion has been submitted');
      back();
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Suggest a Trip</h1><span/></header>
      <form className="flow-body profile-form" onSubmit={submit}>
        <div className="form-group"><label>Origin</label><input required value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} placeholder="Where from?"/></div>
        <div className="form-group"><label>Destination</label><input required value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="Where to?"/></div>
        <div className="form-group"><label>Message (Optional)</label><textarea rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Tell us more about this route..."/></div>
        <button className="continue mt-4" disabled={loading} type="submit">{loading ? 'Submitting...' : 'Submit Suggestion'}</button>
      </form>
    </div>
  );
}

function CloseFriendsView({ back, friends = [], api, notify, onChange }) {
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [friendForm, setFriendForm] = useState({ phone: '' });
  const visibleFriends = friends.filter(friend => `${friend.name} ${friend.phone}`.toLowerCase().includes(query.trim().toLowerCase()));
  const addFriend = async (event) => {
    event.preventDefault();
    try {
      setAdding(true);
      await api('/api/friends', { method: 'POST', body: JSON.stringify(friendForm) });
      await onChange();
      notify('Friend added');
      setFriendForm({ phone: '' });
      setShowForm(false);
    } catch (error) {
      notify(error.message);
    } finally {
      setAdding(false);
    }
  };
  const removeFriend = async (id) => {
    try {
      await api(`/api/friends/${id}`, { method: 'DELETE' });
      await onChange();
      notify('Friend removed');
    } catch (error) {
      notify(error.message);
    }
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Close Friends</h1><span/></header>
      <div className="flow-body list-view">
        {showForm && <form className="friend-form" onSubmit={addFriend}>
          <div><b>Add a close friend</b><button type="button" onClick={()=>setShowForm(false)} aria-label="Close"><X/></button></div>
          <p>Enter the phone number linked to their Tankua account.</p>
          <label>Phone number<input required minLength={7} inputMode="tel" value={friendForm.phone} onChange={event=>setFriendForm({...friendForm,phone:event.target.value})} placeholder="+251 9XX XXX XXX"/></label>
          <button className="continue" type="submit" disabled={adding}>{adding ? 'Saving...' : 'Save friend'}</button>
        </form>}
        <div className="search-input mb-4"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search friends..."/></div>
        {visibleFriends.length === 0 ? (
          <div className="empty"><span><UsersRound size={40}/></span><h2>No friends found</h2><p>Add friends to see their trips and travel together</p></div>
        ) : (
          visibleFriends.map(f => (
            <div key={f.id} className="list-card">
              <div className="list-avatar">{f.name[0]}</div>
              <div className="list-info"><b>{f.name}</b><p>{f.phone}</p><small>{f.trips_together || 0} trips together</small></div>
              <button className="icon-button danger-text" onClick={() => removeFriend(f.id)}><X size={18}/></button>
            </div>
          ))
        )}
      </div>
      <div className="flow-sticky"><button className="continue" onClick={()=>setShowForm(true)}>Add Friend</button></div>
    </div>
  );
}

function ReferFriendView({ back, notify, code }) {
  const referralCode = code || 'TANKUA';
  const copyReferral = async () => {
    const link = `https://t.me/tankua_tma_bot?start=${encodeURIComponent(referralCode)}`;
    await navigator.clipboard?.writeText(link);
    notify('Referral link copied');
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Refer a Friend</h1><span/></header>
      <div className="flow-body text-center">
        <div className="empty"><span><Share2 size={40}/></span><h2>Invite Friends</h2><p>Share Tankua with friends and earn 500 points for their first trip!</p></div>
        <div className="referral-box"><b>{referralCode}</b></div>
      </div>
      <div className="flow-sticky"><button className="continue" onClick={copyReferral}>Copy Link</button></div>
    </div>
  );
}

function RewardsView({ back, rewards = {}, transactions = [] }) {
  const points = Number(rewards.current_points || 0);
  const nextTier = Math.ceil((points + 1) / 2000) * 2000;
  const progress = Math.min(100, Math.round((points / Math.max(nextTier, 2000)) * 100));
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Rewards</h1><span/></header>
      <div className="flow-body">
        <div className="rewards-card">
          <div className="rewards-icon"><Gift size={40}/></div>
          <h2>{points.toLocaleString()} Points</h2>
          <p>{points >= 5000 ? 'Voyager Tier' : 'Explorer Tier'}</p>
          <div className="progress mt-4"><i style={{width:`${progress}%`}}/></div>
          <small>{Math.max(0, nextTier - points).toLocaleString()} more points to your next milestone</small>
        </div>
        {transactions.length > 0 && <div className="list-view">{transactions.map(item=><div className="list-card" key={item.id}><div className="list-icon"><Gift/></div><div className="list-info"><b>{item.description}</b><p>{new Date(item.created_at).toLocaleDateString()}</p></div><strong>{item.amount > 0 ? '+' : ''}{item.amount}</strong></div>)}</div>}
      </div>
    </div>
  );
}

function CouponsView({ back, coupons = [] }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Coupons</h1><span/></header>
      <div className="flow-body list-view">
        {coupons.length ? coupons.map(coupon=><div className="list-card" key={coupon.id}>
          <div className="list-icon"><Tag/></div>
          <div className="list-info"><b>{coupon.code}</b><p>{coupon.description || coupon.name}</p><small>Expires {new Date(coupon.valid_until).toLocaleDateString()}</small></div>
        </div>):<div className="empty"><span><Tag/></span><h2>No active coupons</h2><p>Available discounts will appear here.</p></div>}
      </div>
    </div>
  );
}

function NotificationsView({ back, notifications = [], api, onChange }) {
  const markRead = async (notification) => {
    if (notification.is_read) return;
    await api(`/api/notifications/${notification.id}/read`, { method: 'POST' });
    await onChange();
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Notifications</h1><span/></header>
      <div className="flow-body list-view">{notifications.length ? notifications.map(item=><button className={`list-card notification-row ${item.is_read?'read':''}`} key={item.id} onClick={()=>markRead(item)}><div className="list-icon bg-blue"><Bell color="white"/></div><div className="list-info"><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></div>{!item.is_read&&<i className="unread-dot"/>}</button>):<div className="empty"><span><Bell/></span><h2>No notifications</h2><p>Booking and payment updates will appear here.</p></div>}</div>
    </div>
  );
}

function NotificationSettingsView({ back, preferences, api, notify, onChange }) {
  const [push, setPush] = useState(preferences?.push_enabled ?? true);
  const [sms, setSms] = useState(preferences?.sms_enabled ?? false);
  const save = async (nextPush, nextSms) => {
    try {
      await api('/api/notification-preferences', { method: 'PUT', body: JSON.stringify({ push_enabled: nextPush, sms_enabled: nextSms }) });
      await onChange();
      notify('Notification settings saved');
    } catch (error) {
      notify(error.message);
    }
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Notification Settings</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card toggle-card">
          <div className="list-info"><b>Push Notifications</b><p>Updates on bookings and trips</p></div>
          <input type="checkbox" className="toggle" checked={push} onChange={e => {setPush(e.target.checked);save(e.target.checked,sms);}} />
        </div>
        <div className="list-card toggle-card">
          <div className="list-info"><b>SMS Alerts</b><p>Text messages for ticket QR codes</p></div>
          <input type="checkbox" className="toggle" checked={sms} onChange={e => {setSms(e.target.checked);save(push,e.target.checked);}} />
        </div>
      </div>
    </div>
  );
}

function HelpCenterView({ back }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Help Center</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card faq">
          <div className="list-info"><b>How do I book a trip?</b><p>Search for a destination, select an available trip, choose your seats, and pay securely via Chapa.</p></div>
        </div>
        <div className="list-card faq">
          <div className="list-info"><b>Can I cancel my booking?</b><p>Yes, you can cancel up to 24 hours before departure for a full refund.</p></div>
        </div>
        <div className="list-card faq">
          <div className="list-info"><b>How do I get my ticket?</b><p>Your QR ticket is available in the Trips tab. Show it to the driver during pickup.</p></div>
        </div>
      </div>
    </div>
  );
}
function ProfileView({user,open,api,notify}) {
  const initials=(user.name||'T').split(' ').map(part=>part[0]).slice(0,2).join('');
  const signOut = async () => {
    try {
      await api('/api/logout', { method: 'POST' });
      window.Telegram?.WebApp?.close();
      setTimeout(() => window.location.reload(), 300);
    } catch (error) {
      notify(error.message);
    }
  };
  return (
    <div className="page profile">
      <h1>Profile</h1>
      <div className="profile-hero">
        <div className="hero-left">
          <div className="avatar">{user.photo_url ? <img src={user.photo_url} alt={user.name || 'Profile'}/> : initials}</div>
          <div className="hero-text">
            <h2>{user.name||'Telegram Traveler'}</h2>
            <p>@{user.telegram_username||'telegram_user'}</p>
            <span className="telegram-badge"><i className="fa-brands fa-telegram" aria-hidden="true" /> Telegram</span>
          </div>
        </div>
        <button className="edit-chip" onClick={()=>open('account')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Edit
        </button>
      </div>

      <section>
        <small>ACCOUNT</small>
        <div>
          <button onClick={()=>open('account')}><span><UserRound/></span><div><b>My Account</b><small className="sub">Edit your personal details</small></div><ChevronRight/></button>
          <button onClick={()=>open('saved')}><span><Heart/></span><div><b>Saved Destinations</b><small className="sub">Your bookmarked places</small></div><ChevronRight/></button>
        </div>
      </section>

      <section>
        <small>TRAVEL</small>
        <div>
          <button onClick={()=>open('suggest')}><span><MapIcon/></span><div><b>Suggest a Trip</b><small className="sub">Recommend a new route</small></div><ChevronRight/></button>
          <button onClick={()=>open('friends')}><span><UsersRound/></span><div><b>Close Friends</b><small className="sub">Travel with your circle</small></div><ChevronRight/></button>
          <button onClick={()=>open('refer')}><span><Share2/></span><div><b>Refer a Friend</b><small className="sub">Invite friends and earn rewards</small></div><ChevronRight/></button>
        </div>
      </section>

      <section>
        <small>PERKS</small>
        <div>
          <button onClick={()=>open('rewards')}><span><Gift/></span><div><b>Rewards</b><small className="sub">Your points and benefits</small></div><ChevronRight/></button>
          <button onClick={()=>open('coupons')}><span><Tag/></span><div><b>Coupons</b><small className="sub">Discounts and promo codes</small></div><ChevronRight/></button>
        </div>
      </section>

      <section>
        <small>SUPPORT</small>
        <div>
          <button onClick={()=>open('notifications')}><span><Bell/></span><div><b>Notifications</b><small className="sub">See your activity</small></div><ChevronRight/></button>
          <button onClick={()=>open('notification_settings')}><span><Settings/></span><div><b>Notification Settings</b><small className="sub">Manage push preferences</small></div><ChevronRight/></button>
          <button onClick={()=>open('help')}><span><CircleHelp/></span><div><b>Help Center</b><small className="sub">FAQs and support</small></div><ChevronRight/></button>
        </div>
      </section>

      <button className="sign-out-btn" onClick={signOut}>
        <LogOut size={20} /> Sign Out
      </button>

      <p className="version">Tankua · v1.0</p>
    </div>
  );
}
function SimplePage({title,back,icon:Icon,text}) { return <div className="simple-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>{title}</h1><span/></header><div className="empty"><span><Icon/></span><h2>{title}</h2><p>{text}</p></div></div>; }
