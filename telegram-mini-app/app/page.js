'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bell, Bus, CalendarDays, Check, ChevronRight, CircleHelp,
  Building2, Clock3, Compass, CreditCard, Gift, Heart, Home, Info, LocateFixed, Map as MapIcon,
  MapPin, Minus, Navigation, Plus, Search, Share2, ShieldCheck, Star,
  Tag, Ticket, UserRound, UsersRound, X, LogOut, Settings, Phone, ShieldAlert
} from 'lucide-react';

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

function money(n) { return `ETB ${Number(n).toLocaleString()}`; }
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

export default function App() {
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null);
  const [selected, setSelected] = useState(fallbackDestinations[0]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'telebirr' });
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
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [favorites, setFavorites] = useState([1, 4]);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const updated = isFav ? prev.filter(item => item !== id) : [...prev, id];
      notify(isFav ? 'Removed from saved destinations' : 'Added to saved destinations ❤️');
      return updated;
    });
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

  const refreshCatalog = async () => {
    const catalogData = await api(`/api/catalog?refresh=${Date.now()}`);
    setCatalog(catalogData);
    return catalogData;
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
      const productionData = await loadProductionData();
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
      }
    } catch (error) {
      setAuthError(error.message);
      setAuthStatus('error');
    }
  };

  const notify = (text) => {
    setToast(text); vibrate('light'); setTimeout(() => setToast(''), 2200);
  };
  const openDetail = (d) => { setSelected(d); setScreen('detail'); vibrate(); window.scrollTo(0, 0); };
  const goTab = (id) => { setTab(id); setScreen(null); vibrate(); window.scrollTo(0, 0); };
  const goBack = () => {
    const flow = ['trip', 'pickup', 'seats', 'passengers', 'payment'];
    const i = flow.indexOf(screen);
    if (i > 0) setScreen(flow[i - 1]);
    else if (screen === 'trip') setScreen('detail');
    else setScreen(null);
    vibrate();
  };
  const liveDestinations = catalog.destinations.map(normalizeDestination);
  const startBooking = async () => {
    try {
      const freshCatalog = await refreshCatalog();
      const available = freshCatalog.trips.some(trip => trip.destination_id === selected.id);
      if (!available) return notify('No scheduled trips are currently available');
      setBooking({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'chapa' });
      setScreen('trip');
    } catch (error) {
      notify(error.message || 'Could not refresh pickup stations');
    }
  };
  const finishBooking = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const idempotencyKey = crypto.randomUUID();
      const { booking: created } = await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          trip_id: booking.trip.id,
          station_id: booking.pickup.id,
          seats: booking.seats,
          passengers: booking.passengers,
          idempotency_key: idempotencyKey,
        }),
      });
      const { checkout_url } = await api('/api/payments/chapa', {
        method: 'POST',
        body: JSON.stringify({ booking_id: created.id }),
      });
      setBooking({ ...booking, ...created, destination: selected });
      window.location.assign(checkout_url);
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  const openTrip = async (trip) => {
    if (trip.payment_status === 'paid') {
      setBooking(normalizeBookingForUi(trip, liveDestinations));
      setScreen('ticket');
      return;
    }
    try {
      setSubmitting(true);
      const { checkout_url } = await api('/api/payments/chapa', {
        method: 'POST',
        body: JSON.stringify({ booking_id: trip.id }),
      });
      window.location.assign(checkout_url);
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const content = () => {
    if (screen === 'detail') return <Detail destination={selected} catalog={catalog} back={goBack} book={startBooking} notify={notify} favorites={favorites} toggleFavorite={toggleFavorite} />;
    if (['trip','pickup','seats','passengers','payment'].includes(screen))
      return <BookingFlow step={screen} destination={selected} catalog={catalog} booking={booking} setBooking={setBooking} back={goBack} next={(s) => { setScreen(s); window.scrollTo(0,0); vibrate(); }} finish={finishBooking} submitting={submitting} />;
    if (screen === 'confirmation') return <Confirmation booking={booking} home={() => goTab('home')} ticket={() => setScreen('ticket')} />;
    if (screen === 'ticket') return <TicketView booking={booking} back={() => setScreen('confirmation')} />;
    if (screen === 'notifications') return <NotificationsView back={goBack} />;
    if (screen === 'notification_settings') return <NotificationSettingsView back={goBack} />;
    if (screen === 'rewards') return <RewardsView back={goBack} />;
    if (screen === 'coupons') return <CouponsView back={goBack} />;
    if (screen === 'payment') return <PaymentMethodsView back={goBack} />;
    if (screen === 'help') return <HelpCenterView back={goBack} />;
    if (screen === 'account') return <MyAccountView user={user} back={goBack} notify={notify} />;
    if (screen === 'saved') return <SavedDestinationsView destinations={liveDestinations} favorites={favorites} open={openDetail} back={goBack} />;
    if (screen === 'suggest') return <SuggestTripView back={goBack} notify={notify} />;
    if (screen === 'friends') return <CloseFriendsView back={goBack} />;
    if (screen === 'refer') return <ReferFriendView back={goBack} notify={notify} />;
    if (tab === 'home') return <HomeView user={user} destinations={liveDestinations.length ? liveDestinations : fallbackDestinations} category={category} setCategory={setCategory} open={openDetail} goSearch={() => goTab('search')} openNotifications={() => setScreen('notifications')} />;
    if (tab === 'search') return <SearchView destinations={liveDestinations} query={query} setQuery={setQuery} open={openDetail} />;
    if (tab === 'trips') return <TripsView destinations={liveDestinations} trips={bookedTrips} open={openTrip} explore={() => goTab('home')} />;
    if (tab === 'map') return <MapView destinations={liveDestinations} open={openDetail} back={() => goTab('home')} />;
    return <ProfileView user={user} open={(s) => setScreen(s)} notify={notify} />;
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
  const rawDate = item.departure_date || item.date || item.created_at;
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
      time: item.departure_time || item.pickup_time || '06:00 AM',
    },
    pickup: item.pickup || item.pickup_station || { name: item.pickup_name || 'Pickup station' },
    total: Number(item.total_price || 0),
  };
}

function AuthGate({ status, error, retry }) {
  const loading = status === 'loading';
  const telegramRequired = status === 'telegram-required';
  if (loading) return <main className="auth-splash" aria-label="Tankua is loading">
    <img src="/tankua-boat.svg" alt="Tankua"/>
    <h1>Tankua</h1>
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
    <p className="auth-foot">Travel farther. Feel at home.</p>
  </main>;
}

const ALL_CATEGORIES = [
  'All', 'Adventure', 'Cultural', 'Medical', 'Religious', 'Ecotourism',
  'Business', 'Wildlife', 'Cruise', 'Rural', 'Sports', 'Shopping',
  'Wellness', 'Dark', 'Budget', 'Culinary', 'Luxury', 'Voluntourism',
  'Space', 'Accessible', 'Agritourism', 'Photography', 'Ancestry',
  'Educational', 'Urban', 'Historical', 'Nature', 'Sacred', 'Monument',
  'Park', 'Museum', 'City', 'Other'
];

function HomeView({ user, destinations, category, setCategory, open, goSearch, openNotifications }) {
  // Featured destinations: Top 4 most booked, clicked, and featured attractions
  const featured = [...destinations]
    .sort((a, b) => {
      const scoreA = (a.is_featured ? 1000 : 0) + (Number(a.bookings_count || 0) * 10) + Number(a.views_count || 0) + Number(a.rating || 0);
      const scoreB = (b.is_featured ? 1000 : 0) + (Number(b.bookings_count || 0) * 10) + Number(b.views_count || 0) + Number(b.rating || 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);

  // Popular destinations: Top 6 iconic tourist attractions in Ethiopia (not dumping all DB entries)
  const categoryFiltered = category === 'All'
    ? destinations
    : destinations.filter(d => (d.category || '').toLowerCase() === category.toLowerCase());

  const popular = [...categoryFiltered]
    .sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)))
    .slice(0, 6);

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
    <div className="chips">
      {ALL_CATEGORIES.slice(0, 16).map(c => <button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}
    </div>
    <SectionHeader title="Featured" />
    <div className="featured-row">{featured.map(d => <DestinationHero key={d.id} d={d} open={open}/>)}</div>
    <SectionHeader title="Popular destinations" action="See all" onAction={goSearch}/>
    <div className="destination-grid">{popular.map(d => <DestinationCard key={d.id} d={d} open={open}/>)}</div>
    <section className="how">
      <SectionHeader title="How it works"/>
      {[['01','Choose destination','Find a place that inspires you.'],['02','Select your trip','Pick a date, pickup and seats.'],['03','Book & pay','Pay securely and get your QR ticket.']].map(x=><div className="how-row" key={x[0]}><b>{x[0]}</b><div><strong>{x[1]}</strong><p>{x[2]}</p></div></div>)}
    </section>
  </div>;
}

function SectionHeader({ title, action, onAction }) { return <div className="section-head"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}</button>}</div>; }
function DestinationHero({d,open}) { return <button className="hero-card" onClick={()=>open(d)} style={{backgroundImage:`linear-gradient(180deg,transparent 35%,rgba(5,15,28,.88) 100%),url("${d.image}")`}}><div className="hero-content"><h3>{d.name}</h3><p className="hero-location"><MapPin size={13}/>{d.city}</p><div className="hero-meta"><span className="hero-rating"><Star size={13} fill="#ffb800" color="#ffb800"/> {d.rating}</span>{d.price ? <b className="hero-price">From {money(d.price)}</b> : null}</div></div></button>; }
function DestinationCard({d,open}) { return <button className="destination-card" onClick={()=>open(d)}><div className="card-image" style={{backgroundImage:`url("${d.image}")`}}><span>{d.category}</span><Heart size={18}/></div><div className="card-copy"><h3>{d.name}</h3><p><MapPin size={13}/>{d.city}</p><div><span><Star size={13} fill="currentColor"/> {d.rating}</span><b>{money(d.price)}</b></div></div></button>; }

function Detail({ destination:d, catalog, back, book, notify, favorites = [], toggleFavorite }) {
  const destinationTrip=(catalog.trips||[]).find(trip=>trip.destination_id===d.id);
  const provider=(catalog.providers||[]).find(item=>item.id===destinationTrip?.provider_id);
  const isFavorite = favorites.includes(d.id);

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
      <div className="quick-facts"><div><Star/><b>{d.rating}</b><span>{d.reviews} reviews</span></div><div><Clock3/><b>{d.duration}</b><span>Duration</span></div><div><ShieldCheck/><b>Verified</b><span>Tankua partner</span></div></div>
      <h2>About this place</h2><p className="body-copy">{d.description}</p>
      <h2>What’s included</h2><div className="included"><span><Check/>Round-trip transport</span><span><Check/>Professional guide</span><span><Check/>Entrance fees</span><span><Check/>24/7 trip support</span></div>
      {provider&&<div className="provider">{provider.logo_url?<img className="provider-logo-image" src={provider.logo_url} alt={`${provider.name} logo`}/>:<div className="provider-logo"><Building2/></div>}<div><small>OPERATED BY</small><b>{provider.name}</b><p>{Number(provider.rating||0).toFixed(1)} ★ · Verified provider</p></div><ChevronRight/></div>}
    </div>
    <div className="sticky-cta"><div><span>Starting from</span><b>{money(d.price)}</b><small>per person</small></div><button onClick={book}>Book this trip <ChevronRight size={18}/></button></div>
  </div>;
}

function FlowHeader({ step, back }) {
  const steps = ['trip','pickup','seats','passengers','payment']; const index=steps.indexOf(step);
  return <><header className="flow-head"><button onClick={back}><ArrowLeft/></button><div><span>STEP {index+1} OF 5</span><b>{['Select trip','Pickup station','Choose seats','Passenger details','Payment'][index]}</b></div></header><div className="progress"><i style={{width:`${(index+1)*20}%`}}/></div></>;
}
function BookingFlow({ step, destination, catalog, booking, setBooking, back, next, finish, submitting }) {
  const trips = catalog.trips.filter(trip => trip.destination_id === destination.id).map(trip => {
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
    return { ...station, sub: station.address || station.city || '', time: link.pickup_time, extraPrice: Number(link.extra_price || 0) };
  });
  if(step==='trip') return <TripStep destination={destination} trips={trips} providers={catalog.providers||[]} booking={booking} setBooking={setBooking} back={back} next={()=>next('pickup')}/>;
  if(step==='pickup') return <PickupStep pickups={pickups} booking={booking} setBooking={setBooking} back={back} next={()=>next('seats')}/>;
  if(step==='seats') return <SeatStep destination={destination} booking={booking} setBooking={setBooking} back={back} next={()=>next('passengers')}/>;
  if(step==='passengers') return <PassengerForm step={step} back={back} booking={booking} setBooking={setBooking} next={()=>next('payment')}/>;
  return <Payment step={step} back={back} d={destination} booking={booking} setBooking={setBooking} finish={finish} submitting={submitting}/>;
}
function FlowPage({step,back,title,sub,children}) { return <div className="flow-page"><FlowHeader step={step} back={back}/><div className="flow-body"><h1>{title}</h1><p className="lead">{sub}</p>{children}</div></div>; }
function Choice({selected,onClick,children}) { return <button className={`choice ${selected?'selected':''}`} onClick={onClick}>{children}<i className="radio">{selected&&<Check/>}</i></button>; }
function Continue({disabled,onClick,label='Continue'}) { return <button className="continue" disabled={disabled} onClick={onClick}>{label}<ChevronRight/></button>; }

function TripStep({destination,trips,providers,booking,setBooking,back,next}) {
  const providerById=new Map(providers.map(provider=>[provider.id,provider]));
  return <FlowPage step="trip" back={back} title="Select Trip" sub={`Available trips to ${destination.name}`}>
    <div className="mobile-trip-list">{trips.map(trip=>{
      const provider=providerById.get(trip.provider_id);
      const selected=booking.trip?.id===trip.id;
      return <button key={trip.id} className={`mobile-trip-card ${selected?'selected':''}`} onClick={()=>setBooking({...booking,trip,pickup:null,seats:1,passengers:[]})}>
        {provider&&<div className="trip-provider">{provider.logo_url?<img src={provider.logo_url} alt={`${provider.name} logo`}/>:<span><Building2/></span>}<div><small className="provider-eyebrow">OPERATED BY</small><b>{provider.name}</b><small><Star fill="currentColor"/>{Number(provider.rating||0).toFixed(1)} · Verified provider</small></div>{selected&&<Check/>}</div>}
        <div className="trip-schedule"><div><span>DEPARTURE</span><b>{trip.date}</b><small>{trip.time}</small></div><i><Bus/><span>{String(trip.trip_type||'scheduled').split('_').join(' ')}</span></i>{trip.return_date?<div><span>RETURN</span><b>{new Date(trip.return_date).toLocaleDateString([],{month:'short',day:'numeric'})}</b><small>{trip.arrival}</small></div>:<div><span>TRIP</span><b>One way</b><small>Scheduled</small></div>}</div>
        <div className="trip-card-foot"><span><UsersRound/>{trip.left} seats available</span><b>{money(trip.price)} <small>/ seat</small></b></div>
      </button>;
    })}</div>
    {!trips.length&&<div className="flow-empty"><CalendarDays/><h3>No trips available</h3><p>Please check back later or choose another destination.</p></div>}
    <div className="flow-info"><Info/><span><b>Transparent pricing</b>Tankua adds a 5% service fee at checkout.</span></div>
    <div className="flow-sticky"><Continue disabled={!booking.trip} onClick={next}/></div>
  </FlowPage>;
}

function PickupStep({pickups,booking,setBooking,back,next}) {
  const [view,setView]=useState('list');
  return <FlowPage step="pickup" back={back} title="Select Pickup Station" sub="Choose your preferred pickup location">
    <div className="view-toggle"><button className={view==='list'?'active':''} onClick={()=>setView('list')}><Navigation/>List</button><button className={view==='map'?'active':''} onClick={()=>setView('map')}><MapIcon/>Map</button></div>
    {view==='list'?<div className="pickup-list">{pickups.map(p=><button key={p.id} className={`pickup-card ${booking.pickup?.id===p.id?'selected':''}`} onClick={()=>setBooking({...booking,pickup:p})}><span><MapPin/></span><div><b>{p.name}</b><p>{p.sub}</p><small>Pickup at {p.time}{p.extraPrice>0?` · +${money(p.extraPrice)}`:' · Included'}</small></div>{booking.pickup?.id===p.id&&<Check/>}</button>)}</div>:<div className="pickup-map"><div className="map-grid"/>{pickups.map((p,index)=><button key={p.id} className={`pickup-pin ${booking.pickup?.id===p.id?'selected':''}`} style={{left:`${18+(index*23)%65}%`,top:`${19+(index*29)%62}%`}} onClick={()=>setBooking({...booking,pickup:p})}><MapPin fill="currentColor"/><span>{p.name}</span></button>)}</div>}
    {!pickups.length&&<div className="flow-empty"><MapPin/><h3>No pickup stations</h3><p>This provider has not added pickup stations for this trip yet.</p></div>}
    <div className="flow-sticky">{booking.pickup&&<div className="selected-pickup"><Check/><span><b>{booking.pickup.name}</b><small>{booking.pickup.time}{booking.pickup.extraPrice>0?` · +${money(booking.pickup.extraPrice)}`:''}</small></span></div>}<Continue disabled={!booking.pickup} onClick={next}/></div>
  </FlowPage>;
}

function SeatStep({destination,booking,setBooking,back,next}) {
  const limit=Math.min(8,Number(booking.trip?.left||booking.trip?.available_seats||8));
  return <FlowPage step="seats" back={back} title="Select Seats" sub="How many seats do you need?">
    <div className="seat-picker mobile"><div className="people-art"><UsersRound/></div><div className="counter"><button disabled={booking.seats<=1} onClick={()=>setBooking({...booking,seats:booking.seats-1,passengers:[]})}><Minus/></button><div><b>{booking.seats}</b><span>{booking.seats===1?'seat':'seats'}</span></div><button disabled={booking.seats>=limit} onClick={()=>setBooking({...booking,seats:booking.seats+1,passengers:[]})}><Plus/></button></div><p>{limit} currently available · {money(booking.trip?.price||destination.price)} each</p></div>
    <PriceSummary d={destination} booking={booking}/>
    <div className="flow-info"><Info/><span><b>Passenger details come next</b>We need a name and age for every traveler.</span></div>
    <div className="flow-sticky"><Continue onClick={next}/></div>
  </FlowPage>;
}
function PriceSummary({d,booking}) { const perSeat=Number(booking.trip?.price || d.price), base=perSeat*booking.seats+Number(booking.pickup?.extraPrice||0), fee=Math.round(base*.05); return <div className="summary"><h3>Estimated price</h3><p><span>{money(perSeat)} × {booking.seats}</span><b>{money(perSeat*booking.seats)}</b></p>{booking.pickup?.extraPrice>0&&<p><span>Pickup supplement</span><b>{money(booking.pickup.extraPrice)}</b></p>}<p><span>Service fee</span><b>{money(fee)}</b></p><hr/><p className="total"><span>Total</span><b>{money(base+fee)}</b></p><small>Final price is recalculated securely when you book.</small></div>; }

function PassengerForm({step,back,booking,setBooking,next}) {
  const initial=Array.from({length:booking.seats},(_,i)=>booking.passengers[i]||{name:i===0?'Abel Traveler':'',age:''});
  const [people,setPeople]=useState(initial);
  const update=(i,k,v)=>{const p=[...people];p[i]={...p[i],[k]:v};setPeople(p)};
  const valid=people.every(p=>p.name.trim()&&p.age);
  return <FlowPage step={step} back={back} title="Who’s traveling?" sub="Enter passenger details exactly as shown on an ID.">{people.map((p,i)=><div className="passenger-card" key={i}><h3><UserRound/> Passenger {i+1}{i===0&&<span>Primary</span>}</h3><label>Full name<input value={p.name} onChange={e=>update(i,'name',e.target.value)} placeholder="Full legal name"/></label><label>Age<input inputMode="numeric" value={p.age} onChange={e=>update(i,'age',e.target.value.replace(/\\D/g,''))} placeholder="Age"/></label></div>)}<Continue disabled={!valid} onClick={()=>{setBooking({...booking,passengers:people});next()}}/></FlowPage>;
}
function Payment({step,back,d,booking,finish,submitting}) {
  const perSeat=Number(booking.trip?.price||d.price), base=perSeat*booking.seats+Number(booking.pickup?.extraPrice||0), total=base+Math.round(base*.05);
  return <FlowPage step={step} back={back} title="Secure payment" sub="You’ll continue to Chapa’s encrypted checkout."><div className="secure-note"><ShieldCheck/><span><b>Server-verified checkout</b>Price and seat availability are checked again before payment.</span></div><Choice selected><div className="pay-logo chapa"><img src="/chapa-logo.svg" alt="Chapa"/></div><div className="pay-copy"><b>Chapa</b><p>Card, bank or mobile money</p></div></Choice><PriceSummary d={d} booking={booking}/><Continue disabled={submitting} onClick={finish} label={submitting?'Creating secure checkout…':`Continue · ${money(total)}`}/></FlowPage>;
}

function Confirmation({booking,home,ticket}) { return <div className="confirmation"><div className="success-orbit"><span><Check/></span></div><p className="eyebrow">BOOKING CONFIRMED</p><h1>You’re going to<br/>{booking.destination.name}!</h1><p>Your trip is reserved. We’ve added your ticket to the Trips tab.</p><div className="confirmation-card"><img src={booking.destination.image}/><div><b>{booking.destination.name}</b><span><CalendarDays/>{booking.trip.date} · {booking.trip.time}</span><span><MapPin/>{booking.pickup.name}</span><span><UsersRound/>{booking.seats} traveler{booking.seats>1?'s':''}</span></div><strong>{booking.id}</strong></div><button className="continue" onClick={ticket}>View QR ticket <Ticket/></button><button className="text-button" onClick={home}>Back to home</button></div>; }
function TicketView({booking,back}) { return <div className="ticket-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Your ticket</h1><span/></header><div className="ticket-card"><div className="ticket-top"><img src="/tankua-logo.png"/><span><b>TANKUA</b><small>EXPLORE ETHIOPIA</small></span></div><div className="ticket-destination" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(5,15,28,.85)),url("${booking.destination.image}")`}}><h2>{booking.destination.name}</h2><p>{booking.trip.date}</p></div><div className="ticket-info"><p><span>DEPARTURE<b>{booking.trip.time}</b></span><span>SEATS<b>{booking.seats}</b></span></p><p><span>PICKUP<b>{booking.pickup.name}</b></span><span>BOOKING<b>{booking.id}</b></span></p><div className="qr"><div className="qr-pattern">{Array.from({length:81},(_,i)=><i key={i} className={(i*7+i%5)%3===0?'on':''}/>)}</div><small>Present this code at pickup</small></div></div></div><div className="info-note"><Info/><p><b>Ready for your trip?</b>Arrive 15 minutes before departure with a valid ID.</p></div></div>; }

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
    {list.length?<div className="search-list">{list.map(d=><button key={d.id} onClick={()=>open(d)}><div className="search-thumb"><img src={d.image} alt={d.name}/><span>{d.category}</span></div><div className="search-copy"><h3>{d.name}</h3><p><MapPin size={12}/>{d.city}</p><div><span><Star size={12} fill="#ffb800" color="#ffb800"/>{d.rating||'New'}</span><b>From {money(d.price)}</b></div></div><i><ChevronRight size={16}/></i></button>)}</div>:<div className="search-empty"><span>🧭</span><h2>No journeys found</h2><p>Try another place, city, or experience.</p><button onClick={()=>{setQuery('');setSelectedCat('All');}}>Show all places</button></div>}
  </div>;
}
function TripsView({trips,destinations,open,explore}) {
  const [filter,setFilter]=useState('upcoming');
  const filtered=trips.filter(trip=>{
    const status=String(trip.status||'pending').toLowerCase();
    if(filter==='completed') return status==='completed';
    if(filter==='cancelled') return status==='cancelled'||status==='canceled';
    return !['completed','cancelled','canceled'].includes(status);
  });
  const labels={upcoming:'upcoming',completed:'completed',cancelled:'cancelled'};
  const upcomingCount=trips.filter(trip=>!['completed','cancelled','canceled'].includes(String(trip.status||'pending').toLowerCase())).length;
  return <div className="page trips-page"><header className="trips-hero">
      <div className="trips-hero-icon"><Bus/></div>
      <div className="trips-hero-copy"><p className="eyebrow">YOUR JOURNEYS</p><h1>My trips</h1><span>Tickets, pickup details and travel plans</span></div>
      <div className="trips-count"><b>{upcomingCount}</b><span>Upcoming</span></div>
    </header>
    <div className="segmented">
      {['upcoming','completed','cancelled'].map(item=><button key={item} className={filter===item?'active':''} onClick={()=>{setFilter(item);vibrate();}}>{item[0].toUpperCase()+item.slice(1)}</button>)}
    </div>
    {filtered.length?filtered.map(raw=>{const t=normalizeBookingForUi(raw,destinations);return <button className="booked-card" onClick={()=>open(raw)} key={t.id}><img src={t.destination.image}/><div><span>{filter==='cancelled'?'Cancelled':filter==='completed'?'Trip completed':t.payment_status==='paid'?'Paid · confirmed':'Payment pending'}</span><h3>{t.destination.name}</h3><p><CalendarDays/>{t.trip.date} · {t.trip.time}</p><p><MapPin/>{t.pickup.name}</p><b>{filter==='completed'?'View trip':filter==='cancelled'?'View details':t.payment_status==='paid'?'View ticket':'Complete payment'} <ChevronRight/></b></div></button>}):<div className="empty"><span><Bus/></span><h2>No {labels[filter]} trips</h2><p>{filter==='upcoming'?'Your next adventure is waiting. Book a trip and it will show up here.':`Your ${labels[filter]} journeys will appear here.`}</p>{filter==='upcoming'&&<button onClick={explore}>Explore destinations</button>}</div>}
  </div>;
}

function MapView({destinations,open,back}) {
  const mapElement=useRef(null);
  const mapInstance=useRef(null);
  const markers=useRef([]);
  const userMarker=useRef(null);
  const [selected,setSelected]=useState(destinations[0]||null);
  const [query,setQuery]=useState('');
  const [locating,setLocating]=useState(false);
  const [mapReady,setMapReady]=useState(false);

  useEffect(()=>{
    let disposed=false;
    import('leaflet').then(({default:L})=>{
      if(disposed||!mapElement.current||mapInstance.current) return;
      const map=L.map(mapElement.current,{zoomControl:false,attributionControl:true}).setView([9.03,38.74],6);
      L.control.zoom({position:'bottomright'}).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapInstance.current=map;
      setMapReady(true);
      setTimeout(()=>map.invalidateSize(),100);
    });
    return()=>{disposed=true;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;}};
  },[]);

  useEffect(()=>{
    if(!mapInstance.current || !mapReady) return;
    let active=true;
    import('leaflet').then(({default:L})=>{
      if(!active||!mapInstance.current)return;
      markers.current.forEach(m=>m.remove());
      markers.current=[];
      destinations.forEach(item=>{
        const coords=destinationCoordinates(item);
        if(!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return;
        const isSel=selected?.id===item.id;
        const priceNum=Number(item.price||0);
        const priceStr=priceNum ? (priceNum>=1000?`${(priceNum/1000).toFixed(priceNum%1000===0?0:1)}k`:priceNum) : '0';

        const iconHtml=`<div class="map-pin-badge ${isSel?'selected':''}">
          <span class="pin-icon">📍</span>
          <b class="pin-price">ETB ${priceStr}</b>
        </div>`;

        const customIcon=L.divIcon({
          html:iconHtml,
          className:'map-pin-wrapper',
          iconSize:[68,28],
          iconAnchor:[34,14],
        });

        const marker=L.marker(coords,{icon:customIcon}).addTo(mapInstance.current);
        marker.on('click',()=>{setSelected(item);vibrate();});
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
    if(match&&mapInstance.current){setSelected(match);mapInstance.current.flyTo(match.coordinates,11,{duration:.7});}
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

function MyAccountView({ user, back, notify }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    emergency_contact: user?.emergency_contact || '',
    location: user?.location || '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.phone_number) {
      notify('Name and phone number are required');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      notify('Profile updated successfully');
      back();
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    try {
      setDeleting(true);
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

function SuggestTripView({ back, notify }) {
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/suggestions', { method: 'POST' });
    notify('Thank you! Your route suggestion has been submitted.');
    back();
  };
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Suggest a Trip</h1><span/></header>
      <form className="flow-body profile-form" onSubmit={submit}>
        <div className="form-group"><label>Origin</label><input required placeholder="Where from?"/></div>
        <div className="form-group"><label>Destination</label><input required placeholder="Where to?"/></div>
        <div className="form-group"><label>Message (Optional)</label><textarea rows={4} placeholder="Tell us more about this route..."/></div>
        <button className="continue mt-4" disabled={loading} type="submit">{loading ? 'Submitting...' : 'Submit Suggestion'}</button>
      </form>
    </div>
  );
}

function CloseFriendsView({ back }) {
  const [friends, setFriends] = useState([
    { id: '1', name: 'John Doe', phone: '0912345678', trips: 5 },
    { id: '2', name: 'Jane Smith', phone: '0918765432', trips: 3 },
  ]);
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Close Friends</h1><span/></header>
      <div className="flow-body list-view">
        <div className="search-input mb-4"><Search size={18}/><input placeholder="Search friends..."/></div>
        {friends.length === 0 ? (
          <div className="empty"><span><UsersRound size={40}/></span><h2>No friends found</h2><p>Add friends to see their trips and travel together</p></div>
        ) : (
          friends.map(f => (
            <div key={f.id} className="list-card">
              <div className="list-avatar">{f.name[0]}</div>
              <div className="list-info"><b>{f.name}</b><p>{f.phone}</p><small>{f.trips} trips together</small></div>
              <button className="icon-button danger-text" onClick={() => setFriends(friends.filter(x => x.id !== f.id))}><X size={18}/></button>
            </div>
          ))
        )}
      </div>
      <div className="flow-sticky"><button className="continue">Add Friend</button></div>
    </div>
  );
}

function ReferFriendView({ back, notify }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Refer a Friend</h1><span/></header>
      <div className="flow-body text-center">
        <div className="empty"><span><Share2 size={40}/></span><h2>Invite Friends</h2><p>Share Tankua with friends and earn 500 points for their first trip!</p></div>
        <div className="referral-box"><b>TANKUA-WELCOME-2026</b></div>
      </div>
      <div className="flow-sticky"><button className="continue" onClick={() => notify('Code copied to clipboard!')}>Copy Link</button></div>
    </div>
  );
}

function RewardsView({ back }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Rewards</h1><span/></header>
      <div className="flow-body">
        <div className="rewards-card">
          <div className="rewards-icon"><Gift size={40}/></div>
          <h2>1,240 Points</h2>
          <p>Explorer Tier</p>
          <div className="progress mt-4"><i style={{width:'40%'}}/></div>
          <small>760 more points to reach Voyager Tier</small>
        </div>
      </div>
    </div>
  );
}

function CouponsView({ back }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Coupons</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card">
          <div className="list-icon"><Tag/></div>
          <div className="list-info"><b>WELCOME10</b><p>10% off your first trip</p><small>Expires in 30 days</small></div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsView({ back }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Payment Methods</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card">
          <div className="list-icon"><CreditCard/></div>
          <div className="list-info"><b>Chapa (Default)</b><p>Mobile money, CBE Birr, Telebirr</p></div>
        </div>
      </div>
    </div>
  );
}

function NotificationsView({ back }) {
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Notifications</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card">
          <div className="list-icon bg-blue"><Bell color="white"/></div>
          <div className="list-info"><b>Welcome to Tankua!</b><p>Start exploring Ethiopia today.</p><small>2 days ago</small></div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettingsView({ back }) {
  const [push, setPush] = useState(true);
  const [sms, setSms] = useState(false);
  return (
    <div className="flow-page">
      <header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Notification Settings</h1><span/></header>
      <div className="flow-body list-view">
        <div className="list-card toggle-card">
          <div className="list-info"><b>Push Notifications</b><p>Updates on bookings and trips</p></div>
          <input type="checkbox" className="toggle" checked={push} onChange={e => setPush(e.target.checked)} />
        </div>
        <div className="list-card toggle-card">
          <div className="list-info"><b>SMS Alerts</b><p>Text messages for ticket QR codes</p></div>
          <input type="checkbox" className="toggle" checked={sms} onChange={e => setSms(e.target.checked)} />
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
function ProfileView({user,open}) {
  const initials=(user.name||'T').split(' ').map(part=>part[0]).slice(0,2).join('');
  return (
    <div className="page profile">
      <h1>Profile</h1>
      <div className="profile-hero">
        <div className="hero-left">
          <div className="avatar">{initials}</div>
          <div className="hero-text">
            <h2>{user.name||'Telegram Traveler'}</h2>
            <p>@{user.telegram_username||'telegram_user'}</p>
            <span className="telegram-badge">✈ Telegram</span>
          </div>
        </div>
        <button className="edit-chip">
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
          <button onClick={()=>open('payment')}><span><CreditCard/></span><div><b>Payment Methods</b><small className="sub">Manage your payment options</small></div><ChevronRight/></button>
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

      <button className="sign-out-btn" onClick={() => window.Telegram?.WebApp?.close()}>
        <LogOut size={20} /> Sign Out
      </button>

      <p className="version">Tankua · v1.0</p>
    </div>
  );
}
function SimplePage({title,back,icon:Icon,text}) { return <div className="simple-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>{title}</h1><span/></header><div className="empty"><span><Icon/></span><h2>{title}</h2><p>{text}</p></div></div>; }
