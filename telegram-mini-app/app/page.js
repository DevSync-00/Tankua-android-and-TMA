'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Bell, Bus, CalendarDays, Check, ChevronRight, CircleHelp,
  Clock3, Compass, CreditCard, Gift, Heart, Home, Info, LocateFixed, Map,
  MapPin, Minus, Navigation, Plus, Search, Share2, ShieldCheck, Star,
  Tag, Ticket, UserRound, UsersRound, X
} from 'lucide-react';

const fallbackDestinations = [
  { id: 1, name: 'Fasil Ghebbi', city: 'Gondar', region: 'Amhara', category: 'Historical', rating: 4.9, reviews: 328, price: 2400, duration: '2 days', image: '/destinations/onboarding-fasil-ghebbi.png', description: 'Walk through the royal enclosure of Ethiopia’s emperors, where palaces, castles and history meet in the heart of Gondar.' },
  { id: 2, name: 'Blue Nile Falls', city: 'Bahir Dar', region: 'Amhara', category: 'Nature', rating: 4.8, reviews: 216, price: 1800, duration: '1 day', image: '/destinations/onboarding-waterfall.png', description: 'Feel the mist and power of one of Ethiopia’s most iconic natural wonders, locally known as Tis Abay — the smoking water.' },
  { id: 3, name: 'Danakil Depression', city: 'Dallol', region: 'Afar', category: 'Adventure', rating: 4.7, reviews: 184, price: 7200, duration: '3 days', image: '/destinations/onboarding-dallol.png', description: 'Explore a surreal landscape of salt flats, sulfur springs and volcanic terrain in one of Earth’s most extraordinary places.' },
  { id: 4, name: 'Lalibela Churches', city: 'Lalibela', region: 'Amhara', category: 'Religious', rating: 4.9, reviews: 492, price: 3200, duration: '2 days', image: '/destinations/pexels-mussie-belachew-2153963984-33101756.jpg', description: 'Discover eleven medieval rock-hewn churches carved from living stone, a spiritual landmark unlike anywhere else.' },
  { id: 5, name: 'Simien Mountains', city: 'Debark', region: 'Amhara', category: 'Hiking', rating: 4.8, reviews: 267, price: 4800, duration: '3 days', image: '/destinations/pexels-malaydi-7941708.jpg', description: 'Trek dramatic escarpments, spot gelada baboons and wake to vast highland views in Ethiopia’s rooftop wilderness.' },
  { id: 6, name: 'Harar Jugol', city: 'Harar', region: 'Harari', category: 'Cultural', rating: 4.7, reviews: 201, price: 2800, duration: '2 days', image: '/destinations/pexels-lovetosmile-5034469.jpg', description: 'Get lost in the colorful alleys, markets and living traditions of this ancient walled city.' },
];

const categories = ['All', 'Historical', 'Nature', 'Adventure', 'Religious', 'Hiking', 'Cultural'];
const tabs = [
  ['home', Home, 'Home'], ['search', Search, 'Search'], ['trips', Bus, 'Trips'],
  ['map', Map, 'Map'], ['profile', UserRound, 'Profile']
];

function money(n) { return `ETB ${Number(n).toLocaleString()}`; }
function vibrate(type = 'light') { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type); }

export default function App() {
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null);
  const [selected, setSelected] = useState(fallbackDestinations[0]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'telebirr' });
  const [bookedTrips, setBookedTrips] = useState([]);
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authError, setAuthError] = useState('');
  const [catalog, setCatalog] = useState({ destinations: [], trips: [], stations: [], trip_pickup_stations: [] });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

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
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  };

  const loadProductionData = async () => {
    const [catalogData, bookingsData] = await Promise.all([api('/api/catalog'), api('/api/bookings')]);
    setCatalog(catalogData);
    setBookedTrips(bookingsData.bookings || []);
    return { catalogData, bookings: bookingsData.bookings || [] };
  };

  const authenticate = async () => {
    try {
      setAuthStatus('loading');
      setAuthError('');
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
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
  const startBooking = () => {
    const available = catalog.trips.some(trip => trip.destination_id === selected.id);
    if (!available) return notify('No scheduled trips are currently available');
    setBooking({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'chapa' });
    setScreen('trip');
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
    if (screen === 'detail') return <Detail destination={selected} back={goBack} book={startBooking} notify={notify} />;
    if (['trip','pickup','seats','passengers','payment'].includes(screen))
      return <BookingFlow step={screen} destination={selected} catalog={catalog} booking={booking} setBooking={setBooking} back={goBack} next={(s) => { setScreen(s); window.scrollTo(0,0); vibrate(); }} finish={finishBooking} submitting={submitting} />;
    if (screen === 'confirmation') return <Confirmation booking={booking} home={() => goTab('home')} ticket={() => setScreen('ticket')} />;
    if (screen === 'ticket') return <TicketView booking={booking} back={() => setScreen('confirmation')} />;
    if (screen === 'notifications') return <SimplePage title="Notifications" back={goBack} icon={Bell} text="You’re all caught up. Booking confirmations and trip updates will appear here." />;
    if (screen === 'rewards') return <SimplePage title="Rewards" back={goBack} icon={Gift} text="You have 1,240 Tankua points. Keep exploring to unlock your next travel reward." />;
    if (screen === 'help') return <SimplePage title="Help Center" back={goBack} icon={CircleHelp} text="Find answers about bookings, payment, refunds and your Tankua account." />;
    if (tab === 'home') return <HomeView user={user} destinations={liveDestinations} category={category} setCategory={setCategory} open={openDetail} goSearch={() => goTab('search')} />;
    if (tab === 'search') return <SearchView destinations={liveDestinations} query={query} setQuery={setQuery} open={openDetail} />;
    if (tab === 'trips') return <TripsView destinations={liveDestinations} trips={bookedTrips} open={openTrip} explore={() => goTab('home')} />;
    if (tab === 'map') return <MapView destinations={liveDestinations} open={openDetail} />;
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
  };
}

function normalizeBookingForUi(item, destinations) {
  const destination = destinations.find(candidate => candidate.id === item.destination_id) || {
    name: item.destination_name || 'Tankua Trip',
    image: fallbackDestinations[0].image,
  };
  const date = new Date(item.date || item.created_at);
  return {
    ...item,
    destination,
    trip: {
      date: date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      time: item.pickup_station?.pickup_time || '—',
    },
    pickup: item.pickup_station || { name: 'Pickup station' },
    total: Number(item.total_price || 0),
  };
}

function AuthGate({ status, error, retry }) {
  const loading = status === 'loading';
  return <main className="auth-gate">
    <img src="/icon.png" alt="Tankua"/>
    <p className="eyebrow">TANKUA · TELEGRAM</p>
    <h1>{loading ? 'Securing your journey…' : status === 'telegram-required' ? 'Open Tankua in Telegram' : 'We couldn’t sign you in'}</h1>
    <p>{loading ? 'Verifying your Telegram session and loading live trips.' : status === 'telegram-required' ? 'This production Mini App only accepts verified launches from the official Tankua Telegram bot.' : error}</p>
    {status === 'telegram-required' && <a href="https://t.me/" target="_blank" rel="noreferrer">Open Telegram</a>}
    {status === 'error' && <button onClick={retry}>Try again</button>}
    <small><ShieldCheck/> Verified Telegram authentication</small>
  </main>;
}

function HomeView({ user, destinations, category, setCategory, open, goSearch }) {
  const filtered = category === 'All' ? destinations : destinations.filter(d => d.category === category);
  return <div className="page home-page">
    <header className="home-header">
      <div><p className="eyebrow">Welcome, {(user.name || 'Traveler').split(' ')[0]} 👋</p><h1>Explore <em>Ethiopia</em></h1><p className="muted">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p></div>
      <button className="icon-button"><Bell size={21}/><i/></button>
    </header>
    <button className="search-bar" onClick={goSearch}><Search size={19}/><span>Where do you want to go?</span></button>
    <div className="chips">{categories.map(c => <button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <SectionHeader title="Featured" />
    <div className="featured-row">{filtered.slice(0,4).map(d => <DestinationHero key={d.id} d={d} open={open}/>)}</div>
    <SectionHeader title="Popular destinations" action="See all" onAction={goSearch}/>
    <div className="destination-grid">{filtered.map(d => <DestinationCard key={d.id} d={d} open={open}/>)}</div>
    <section className="how">
      <SectionHeader title="How it works"/>
      {[['01','Choose destination','Find a place that inspires you.'],['02','Select your trip','Pick a date, pickup and seats.'],['03','Book & pay','Pay securely and get your QR ticket.']].map(x=><div className="how-row" key={x[0]}><b>{x[0]}</b><div><strong>{x[1]}</strong><p>{x[2]}</p></div></div>)}
    </section>
  </div>;
}

function SectionHeader({ title, action, onAction }) { return <div className="section-head"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}</button>}</div>; }
function DestinationHero({d,open}) { return <button className="hero-card" onClick={()=>open(d)} style={{backgroundImage:`linear-gradient(180deg,transparent 30%,rgba(5,15,28,.82)),url("${d.image}")`}}><span className="rating"><Star size={13} fill="currentColor"/> {d.rating}</span><div><h3>{d.name}</h3><p><MapPin size={14}/>{d.city}</p><b>From {money(d.price)}</b></div></button>; }
function DestinationCard({d,open}) { return <button className="destination-card" onClick={()=>open(d)}><div className="card-image" style={{backgroundImage:`url("${d.image}")`}}><span>{d.category}</span><Heart size={18}/></div><div className="card-copy"><h3>{d.name}</h3><p><MapPin size={13}/>{d.city}</p><div><span><Star size={13} fill="currentColor"/> {d.rating}</span><b>{money(d.price)}</b></div></div></button>; }

function Detail({ destination:d, back, book, notify }) {
  return <div className="detail-page">
    <div className="detail-hero" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.16),transparent 38%,rgba(5,15,28,.78)),url("${d.image}")`}}>
      <div className="floating-head"><button onClick={back}><ArrowLeft/></button><div><button onClick={()=>notify('Saved to favorites')}><Heart/></button><button onClick={()=>{navigator.share?.({title:d.name,text:d.description});notify('Ready to share')}}><Share2/></button></div></div>
      <div className="detail-title"><span>{d.category}</span><h1>{d.name}</h1><p><MapPin size={15}/>{d.city}, {d.region}</p></div>
    </div>
    <div className="detail-content">
      <div className="quick-facts"><div><Star/><b>{d.rating}</b><span>{d.reviews} reviews</span></div><div><Clock3/><b>{d.duration}</b><span>Duration</span></div><div><ShieldCheck/><b>Verified</b><span>Tankua partner</span></div></div>
      <h2>About this place</h2><p className="body-copy">{d.description}</p>
      <h2>What’s included</h2><div className="included"><span><Check/>Round-trip transport</span><span><Check/>Professional guide</span><span><Check/>Entrance fees</span><span><Check/>24/7 trip support</span></div>
      <div className="provider"><div className="provider-logo">TA</div><div><b>Tankua Adventures</b><p>Trusted tour operator · 4.9 ★</p></div><ChevronRight/></div>
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
  if(step==='trip') return <FlowPage step={step} back={back} title={`Trips to ${destination.name}`} sub="Live availability from Tankua providers.">{trips.map((t)=><Choice key={t.id} selected={booking.trip?.id===t.id} onClick={()=>setBooking({...booking,trip:t,pickup:null})}><div className="trip-date"><CalendarDays/><b>{t.date}</b></div><div className="route-time"><b>{t.time}</b><span><i/>{t.trip_type}<i/></span><b>{t.arrival}</b></div><div className="choice-meta"><span>{t.label} · {money(t.price)}</span><em>{t.left} seats left</em></div></Choice>)}<Continue disabled={!booking.trip} onClick={()=>next('pickup')}/></FlowPage>;
  if(step==='pickup') return <FlowPage step={step} back={back} title="Where should we pick you up?" sub="All times are local. Please arrive 15 minutes early.">{pickups.map((p)=><Choice key={p.id} selected={booking.pickup?.id===p.id} onClick={()=>setBooking({...booking,pickup:p})}><div className="pickup"><span><Navigation/></span><div><b>{p.name}</b><p>{p.sub}</p></div><strong>{p.time}</strong></div></Choice>)}<Continue disabled={!booking.pickup} onClick={()=>next('seats')}/></FlowPage>;
  if(step==='seats') return <FlowPage step={step} back={back} title="How many travelers?" sub={`Seats are ${money(destination.price)} per person.`}><div className="seat-picker"><div className="people-art"><UsersRound/></div><p>Number of seats</p><div className="counter"><button disabled={booking.seats<=1} onClick={()=>setBooking({...booking,seats:booking.seats-1})}><Minus/></button><b>{booking.seats}</b><button disabled={booking.seats>=8} onClick={()=>setBooking({...booking,seats:booking.seats+1})}><Plus/></button></div><span>Maximum 8 seats per booking</span></div><PriceSummary d={destination} booking={booking}/><Continue onClick={()=>next('passengers')}/></FlowPage>;
  if(step==='passengers') return <PassengerForm step={step} back={back} booking={booking} setBooking={setBooking} next={()=>next('payment')}/>;
  return <Payment step={step} back={back} d={destination} booking={booking} setBooking={setBooking} finish={finish} submitting={submitting}/>;
}
function FlowPage({step,back,title,sub,children}) { return <div className="flow-page"><FlowHeader step={step} back={back}/><div className="flow-body"><h1>{title}</h1><p className="lead">{sub}</p>{children}</div></div>; }
function Choice({selected,onClick,children}) { return <button className={`choice ${selected?'selected':''}`} onClick={onClick}>{children}<i className="radio">{selected&&<Check/>}</i></button>; }
function Continue({disabled,onClick,label='Continue'}) { return <button className="continue" disabled={disabled} onClick={onClick}>{label}<ChevronRight/></button>; }
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
  return <FlowPage step={step} back={back} title="Secure payment" sub="You’ll continue to Chapa’s encrypted checkout."><div className="secure-note"><ShieldCheck/><span><b>Server-verified checkout</b>Price and seat availability are checked again before payment.</span></div><Choice selected><div className="pay-logo chapa">C</div><div className="pay-copy"><b>Chapa Pay</b><p>Card, bank or mobile money</p></div></Choice><PriceSummary d={d} booking={booking}/><Continue disabled={submitting} onClick={finish} label={submitting?'Creating secure checkout…':`Continue · ${money(total)}`}/></FlowPage>;
}

function Confirmation({booking,home,ticket}) { return <div className="confirmation"><div className="success-orbit"><span><Check/></span></div><p className="eyebrow">BOOKING CONFIRMED</p><h1>You’re going to<br/>{booking.destination.name}!</h1><p>Your trip is reserved. We’ve added your ticket to the Trips tab.</p><div className="confirmation-card"><img src={booking.destination.image}/><div><b>{booking.destination.name}</b><span><CalendarDays/>{booking.trip.date} · {booking.trip.time}</span><span><MapPin/>{booking.pickup.name}</span><span><UsersRound/>{booking.seats} traveler{booking.seats>1?'s':''}</span></div><strong>{booking.id}</strong></div><button className="continue" onClick={ticket}>View QR ticket <Ticket/></button><button className="text-button" onClick={home}>Back to home</button></div>; }
function TicketView({booking,back}) { return <div className="ticket-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Your ticket</h1><span/></header><div className="ticket-card"><div className="ticket-top"><img src="/icon.png"/><span><b>TANKUA</b><small>EXPLORE ETHIOPIA</small></span></div><div className="ticket-destination" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(5,15,28,.85)),url("${booking.destination.image}")`}}><h2>{booking.destination.name}</h2><p>{booking.trip.date}</p></div><div className="ticket-info"><p><span>DEPARTURE<b>{booking.trip.time}</b></span><span>SEATS<b>{booking.seats}</b></span></p><p><span>PICKUP<b>{booking.pickup.name}</b></span><span>BOOKING<b>{booking.id}</b></span></p><div className="qr"><div className="qr-pattern">{Array.from({length:81},(_,i)=><i key={i} className={(i*7+i%5)%3===0?'on':''}/>)}</div><small>Present this code at pickup</small></div></div></div><div className="info-note"><Info/><p><b>Ready for your trip?</b>Arrive 15 minutes before departure with a valid ID.</p></div></div>; }

function SearchView({destinations,query,setQuery,open}) { const list=destinations.filter(d=>(d.name+d.city+d.category).toLowerCase().includes(query.toLowerCase())); return <div className="page"><header className="page-head"><div><p className="eyebrow">DISCOVER</p><h1>Find your next trip</h1></div><Bell/></header><label className="search-input"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search destinations, cities..."/>{query&&<button onClick={()=>setQuery('')}><X/></button>}</label><div className="result-head"><b>{query?`${list.length} results`:'Explore all destinations'}</b><span>Sorted by popularity</span></div><div className="search-list">{list.map(d=><button key={d.id} onClick={()=>open(d)}><img src={d.image}/><div><span>{d.category}</span><h3>{d.name}</h3><p><MapPin/>{d.city} · <Star fill="currentColor"/>{d.rating}</p><b>From {money(d.price)}</b></div><ChevronRight/></button>)}</div></div>; }
function TripsView({trips,destinations,open,explore}) { return <div className="page"><header className="page-head"><div><p className="eyebrow">YOUR JOURNEYS</p><h1>Trips</h1></div></header><div className="segmented"><button className="active">Upcoming</button><button>Completed</button><button>Cancelled</button></div>{trips.length?trips.map(raw=>{const t=normalizeBookingForUi(raw,destinations);return <button className="booked-card" onClick={()=>open(raw)} key={t.id}><img src={t.destination.image}/><div><span>{t.payment_status==='paid'?'Paid · confirmed':'Payment pending'}</span><h3>{t.destination.name}</h3><p><CalendarDays/>{t.trip.date} · {t.trip.time}</p><p><MapPin/>{t.pickup.name}</p><b>{t.payment_status==='paid'?'View ticket':'Complete payment'} <ChevronRight/></b></div></button>}):<div className="empty"><span><Bus/></span><h2>No upcoming trips</h2><p>Your next adventure is waiting. Book a trip and it will show up here.</p><button onClick={explore}>Explore destinations</button></div>}</div>; }
function MapView({destinations,open}) { const featured=destinations[1]||destinations[0]; return <div className="map-page"><div className="fake-map"><div className="map-roads"/><header><label><Search/><span>Search this area</span></label><button><LocateFixed/></button></header>{destinations.slice(0,5).map((d,i)=><button key={d.id} className="marker" style={{left:`${15+(i*17)%70}%`,top:`${22+(i*19)%55}%`}} onClick={()=>open(d)}><MapPin fill="currentColor"/><span>{money(d.price).replace('ETB ','')}</span></button>)}{featured&&<div className="map-preview"><img src={featured.image}/><div><span>POPULAR NEARBY</span><h3>{featured.name}</h3><p><Star fill="currentColor"/>{featured.rating} · {featured.city}</p></div><button onClick={()=>open(featured)}><ChevronRight/></button></div>}</div></div>; }
function ProfileView({user,open}) { const initials=(user.name||'T').split(' ').map(part=>part[0]).slice(0,2).join(''); return <div className="page profile"><p className="eyebrow">YOUR SPACE</p><h1>Profile</h1><div className="profile-hero"><div className="avatar">{initials}</div><div><h2>{user.name||'Telegram Traveler'}</h2><p>@{user.telegram_username||'telegram_user'}</p><span>✈ Verified Telegram traveler</span></div></div><section><small>ACCOUNT</small><div><button onClick={()=>open('help')}><span><ShieldCheck/></span><b>Telegram-secured account</b><ChevronRight/></button></div></section><section><small>SUPPORT</small><div><button onClick={()=>open('help')}><span><CircleHelp/></span><b>Help center</b><ChevronRight/></button></div></section><p className="version">Tankua for Telegram · v1.0</p></div>; }
function SimplePage({title,back,icon:Icon,text}) { return <div className="simple-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>{title}</h1><span/></header><div className="empty"><span><Icon/></span><h2>{title}</h2><p>{text}</p></div></div>; }
