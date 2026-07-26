'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Bell, Bus, CalendarDays, Check, ChevronRight, CircleHelp,
  Clock3, Compass, CreditCard, Gift, Heart, Home, Info, LocateFixed, Map,
  MapPin, Minus, Navigation, Plus, Search, Share2, ShieldCheck, Star,
  Tag, Ticket, UserRound, UsersRound, X
} from 'lucide-react';

const destinations = [
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
  const [selected, setSelected] = useState(destinations[0]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [booking, setBooking] = useState({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'telebirr' });
  const [bookedTrips, setBookedTrips] = useState([]);
  const [user, setUser] = useState({ first_name: 'Abel', last_name: 'Traveler', username: 'tankua_guest' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready(); tg.expand(); tg.setHeaderColor('#fffaf0'); tg.setBackgroundColor('#fffaf0');
      if (tg.initDataUnsafe?.user) setUser(tg.initDataUnsafe.user);
    }
    const stored = localStorage.getItem('tankua-trips');
    if (stored) setBookedTrips(JSON.parse(stored));
  }, []);

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
  const startBooking = () => { setBooking({ trip: null, pickup: null, seats: 1, passengers: [], payment: 'telebirr' }); setScreen('trip'); };
  const finishBooking = () => {
    const trip = { ...booking, destination: selected, id: `TNK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: 'Confirmed', total: selected.price * booking.seats + Math.round(selected.price * booking.seats * .05) };
    const next = [trip, ...bookedTrips]; setBookedTrips(next); localStorage.setItem('tankua-trips', JSON.stringify(next));
    setBooking(trip); setScreen('confirmation'); vibrate('heavy');
  };

  const content = () => {
    if (screen === 'detail') return <Detail destination={selected} back={goBack} book={startBooking} notify={notify} />;
    if (['trip','pickup','seats','passengers','payment'].includes(screen))
      return <BookingFlow step={screen} destination={selected} booking={booking} setBooking={setBooking} back={goBack} next={(s) => { setScreen(s); window.scrollTo(0,0); vibrate(); }} finish={finishBooking} />;
    if (screen === 'confirmation') return <Confirmation booking={booking} home={() => goTab('home')} ticket={() => setScreen('ticket')} />;
    if (screen === 'ticket') return <TicketView booking={booking} back={() => setScreen('confirmation')} />;
    if (screen === 'notifications') return <SimplePage title="Notifications" back={goBack} icon={Bell} text="You’re all caught up. Booking confirmations and trip updates will appear here." />;
    if (screen === 'rewards') return <SimplePage title="Rewards" back={goBack} icon={Gift} text="You have 1,240 Tankua points. Keep exploring to unlock your next travel reward." />;
    if (screen === 'help') return <SimplePage title="Help Center" back={goBack} icon={CircleHelp} text="Find answers about bookings, payment, refunds and your Tankua account." />;
    if (tab === 'home') return <HomeView user={user} category={category} setCategory={setCategory} open={openDetail} goSearch={() => goTab('search')} />;
    if (tab === 'search') return <SearchView query={query} setQuery={setQuery} open={openDetail} />;
    if (tab === 'trips') return <TripsView trips={bookedTrips} open={(t) => { setBooking(t); setScreen('ticket'); }} explore={() => goTab('home')} />;
    if (tab === 'map') return <MapView open={openDetail} />;
    return <ProfileView user={user} open={(s) => setScreen(s)} notify={notify} />;
  };

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

function HomeView({ user, category, setCategory, open, goSearch }) {
  const filtered = category === 'All' ? destinations : destinations.filter(d => d.category === category);
  return <div className="page home-page">
    <header className="home-header">
      <div><p className="eyebrow">Welcome, {user.first_name || 'Traveler'} 👋</p><h1>Explore <em>Ethiopia</em></h1><p className="muted">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p></div>
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
function BookingFlow({ step, destination, booking, setBooking, back, next, finish }) {
  const trips=[{time:'06:30',arrival:'13:00',date:'Sat, Aug 8',label:'Morning departure',left:7},{time:'08:00',arrival:'14:30',date:'Sun, Aug 9',label:'Weekend explorer',left:4},{time:'05:45',arrival:'12:15',date:'Sat, Aug 15',label:'Early bird',left:12}];
  const pickups=[{name:'Mexico Square',sub:'In front of Wabe Shebelle Hotel',time:'05:45'},{name:'Megenagna',sub:'Near Zefmesh Grand Mall',time:'06:00'},{name:'CMC Michael',sub:'Beside St. Michael Church',time:'06:15'}];
  if(step==='trip') return <FlowPage step={step} back={back} title={`Trips to ${destination.name}`} sub="Choose the departure that works for you.">{trips.map((t,i)=><Choice key={i} selected={booking.trip?.time===t.time} onClick={()=>setBooking({...booking,trip:t})}><div className="trip-date"><CalendarDays/><b>{t.date}</b></div><div className="route-time"><b>{t.time}</b><span><i/>6h 30m<i/></span><b>{t.arrival}</b></div><div className="choice-meta"><span>{t.label}</span><em>{t.left} seats left</em></div></Choice>)}<Continue disabled={!booking.trip} onClick={()=>next('pickup')}/></FlowPage>;
  if(step==='pickup') return <FlowPage step={step} back={back} title="Where should we pick you up?" sub="All times are local. Please arrive 15 minutes early.">{pickups.map((p,i)=><Choice key={p.name} selected={booking.pickup?.name===p.name} onClick={()=>setBooking({...booking,pickup:p})}><div className="pickup"><span><Navigation/></span><div><b>{p.name}</b><p>{p.sub}</p></div><strong>{p.time}</strong></div></Choice>)}<Continue disabled={!booking.pickup} onClick={()=>next('seats')}/></FlowPage>;
  if(step==='seats') return <FlowPage step={step} back={back} title="How many travelers?" sub={`Seats are ${money(destination.price)} per person.`}><div className="seat-picker"><div className="people-art"><UsersRound/></div><p>Number of seats</p><div className="counter"><button disabled={booking.seats<=1} onClick={()=>setBooking({...booking,seats:booking.seats-1})}><Minus/></button><b>{booking.seats}</b><button disabled={booking.seats>=8} onClick={()=>setBooking({...booking,seats:booking.seats+1})}><Plus/></button></div><span>Maximum 8 seats per booking</span></div><PriceSummary d={destination} booking={booking}/><Continue onClick={()=>next('passengers')}/></FlowPage>;
  if(step==='passengers') return <PassengerForm step={step} back={back} booking={booking} setBooking={setBooking} next={()=>next('payment')}/>;
  return <Payment step={step} back={back} d={destination} booking={booking} setBooking={setBooking} finish={finish}/>;
}
function FlowPage({step,back,title,sub,children}) { return <div className="flow-page"><FlowHeader step={step} back={back}/><div className="flow-body"><h1>{title}</h1><p className="lead">{sub}</p>{children}</div></div>; }
function Choice({selected,onClick,children}) { return <button className={`choice ${selected?'selected':''}`} onClick={onClick}>{children}<i className="radio">{selected&&<Check/>}</i></button>; }
function Continue({disabled,onClick,label='Continue'}) { return <button className="continue" disabled={disabled} onClick={onClick}>{label}<ChevronRight/></button>; }
function PriceSummary({d,booking}) { const base=d.price*booking.seats, fee=Math.round(base*.05); return <div className="summary"><h3>Price summary</h3><p><span>{money(d.price)} × {booking.seats}</span><b>{money(base)}</b></p><p><span>Service fee</span><b>{money(fee)}</b></p><hr/><p className="total"><span>Total</span><b>{money(base+fee)}</b></p></div>; }

function PassengerForm({step,back,booking,setBooking,next}) {
  const initial=Array.from({length:booking.seats},(_,i)=>booking.passengers[i]||{name:i===0?'Abel Traveler':'',age:''});
  const [people,setPeople]=useState(initial);
  const update=(i,k,v)=>{const p=[...people];p[i]={...p[i],[k]:v};setPeople(p)};
  const valid=people.every(p=>p.name.trim()&&p.age);
  return <FlowPage step={step} back={back} title="Who’s traveling?" sub="Enter passenger details exactly as shown on an ID.">{people.map((p,i)=><div className="passenger-card" key={i}><h3><UserRound/> Passenger {i+1}{i===0&&<span>Primary</span>}</h3><label>Full name<input value={p.name} onChange={e=>update(i,'name',e.target.value)} placeholder="Full legal name"/></label><label>Age<input inputMode="numeric" value={p.age} onChange={e=>update(i,'age',e.target.value.replace(/\\D/g,''))} placeholder="Age"/></label></div>)}<Continue disabled={!valid} onClick={()=>{setBooking({...booking,passengers:people});next()}}/></FlowPage>;
}
function Payment({step,back,d,booking,setBooking,finish}) {
  const methods=[['telebirr','Telebirr','Pay from your mobile wallet'],['chapa','Chapa','Card or mobile money'],['cash','Pay later','Reserve now, pay before deadline']];
  return <FlowPage step={step} back={back} title="Choose payment method" sub="Your payment is protected and encrypted."><div className="secure-note"><ShieldCheck/><span><b>Secure checkout</b>Your details are never stored on this device.</span></div>{methods.map(([id,name,sub])=><Choice key={id} selected={booking.payment===id} onClick={()=>setBooking({...booking,payment:id})}><div className={`pay-logo ${id}`}>{id==='telebirr'?'T':id==='chapa'?'C':<Clock3/>}</div><div className="pay-copy"><b>{name}</b><p>{sub}</p></div></Choice>)}<PriceSummary d={d} booking={booking}/><Continue onClick={finish} label={`Pay ${money(d.price*booking.seats+Math.round(d.price*booking.seats*.05))}`}/></FlowPage>;
}

function Confirmation({booking,home,ticket}) { return <div className="confirmation"><div className="success-orbit"><span><Check/></span></div><p className="eyebrow">BOOKING CONFIRMED</p><h1>You’re going to<br/>{booking.destination.name}!</h1><p>Your trip is reserved. We’ve added your ticket to the Trips tab.</p><div className="confirmation-card"><img src={booking.destination.image}/><div><b>{booking.destination.name}</b><span><CalendarDays/>{booking.trip.date} · {booking.trip.time}</span><span><MapPin/>{booking.pickup.name}</span><span><UsersRound/>{booking.seats} traveler{booking.seats>1?'s':''}</span></div><strong>{booking.id}</strong></div><button className="continue" onClick={ticket}>View QR ticket <Ticket/></button><button className="text-button" onClick={home}>Back to home</button></div>; }
function TicketView({booking,back}) { return <div className="ticket-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>Your ticket</h1><span/></header><div className="ticket-card"><div className="ticket-top"><img src="/icon.png"/><span><b>TANKUA</b><small>EXPLORE ETHIOPIA</small></span></div><div className="ticket-destination" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(5,15,28,.85)),url("${booking.destination.image}")`}}><h2>{booking.destination.name}</h2><p>{booking.trip.date}</p></div><div className="ticket-info"><p><span>DEPARTURE<b>{booking.trip.time}</b></span><span>SEATS<b>{booking.seats}</b></span></p><p><span>PICKUP<b>{booking.pickup.name}</b></span><span>BOOKING<b>{booking.id}</b></span></p><div className="qr"><div className="qr-pattern">{Array.from({length:81},(_,i)=><i key={i} className={(i*7+i%5)%3===0?'on':''}/>)}</div><small>Present this code at pickup</small></div></div></div><div className="info-note"><Info/><p><b>Ready for your trip?</b>Arrive 15 minutes before departure with a valid ID.</p></div></div>; }

function SearchView({query,setQuery,open}) { const list=destinations.filter(d=>(d.name+d.city+d.category).toLowerCase().includes(query.toLowerCase())); return <div className="page"><header className="page-head"><div><p className="eyebrow">DISCOVER</p><h1>Find your next trip</h1></div><Bell/></header><label className="search-input"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search destinations, cities..."/>{query&&<button onClick={()=>setQuery('')}><X/></button>}</label><div className="result-head"><b>{query?`${list.length} results`:'Explore all destinations'}</b><span>Sorted by popularity</span></div><div className="search-list">{list.map(d=><button key={d.id} onClick={()=>open(d)}><img src={d.image}/><div><span>{d.category}</span><h3>{d.name}</h3><p><MapPin/>{d.city} · <Star fill="currentColor"/>{d.rating}</p><b>From {money(d.price)}</b></div><ChevronRight/></button>)}</div></div>; }
function TripsView({trips,open,explore}) { return <div className="page"><header className="page-head"><div><p className="eyebrow">YOUR JOURNEYS</p><h1>Trips</h1></div></header><div className="segmented"><button className="active">Upcoming</button><button>Completed</button><button>Cancelled</button></div>{trips.length?trips.map(t=><button className="booked-card" onClick={()=>open(t)} key={t.id}><img src={t.destination.image}/><div><span>{t.status}</span><h3>{t.destination.name}</h3><p><CalendarDays/>{t.trip.date} · {t.trip.time}</p><p><MapPin/>{t.pickup.name}</p><b>View ticket <ChevronRight/></b></div></button>):<div className="empty"><span><Bus/></span><h2>No upcoming trips</h2><p>Your next adventure is waiting. Book a trip and it will show up here.</p><button onClick={explore}>Explore destinations</button></div>}</div>; }
function MapView({open}) { return <div className="map-page"><div className="fake-map"><div className="map-roads"/><header><label><Search/><span>Search this area</span></label><button><LocateFixed/></button></header>{destinations.slice(0,5).map((d,i)=><button key={d.id} className="marker" style={{left:`${15+(i*17)%70}%`,top:`${22+(i*19)%55}%`}} onClick={()=>open(d)}><MapPin fill="currentColor"/><span>{money(d.price).replace('ETB ','')}</span></button>)}<div className="map-preview"><img src={destinations[1].image}/><div><span>POPULAR NEARBY</span><h3>{destinations[1].name}</h3><p><Star fill="currentColor"/>4.8 · Bahir Dar</p></div><button onClick={()=>open(destinations[1])}><ChevronRight/></button></div></div></div>; }
function ProfileView({user,open,notify}) { const groups=[[['Account',UserRound,'My account'],['Notifications',Bell,'notifications']],[['Rewards',Gift,'rewards'],['Coupons',Tag,'Coupons'],['Payment methods',CreditCard,'Payment']],[['Help center',CircleHelp,'help'],['Invite a friend',Share2,'Invite']]]; return <div className="page profile"><p className="eyebrow">YOUR SPACE</p><h1>Profile</h1><div className="profile-hero"><div className="avatar">{(user.first_name?.[0]||'T')+(user.last_name?.[0]||'')}</div><div><h2>{user.first_name} {user.last_name}</h2><p>@{user.username||'telegram_user'}</p><span>✈ Telegram traveler</span></div><button onClick={()=>notify('Profile editing is ready')}>Edit</button></div>{groups.map((g,i)=><section key={i}><small>{['ACCOUNT','PERKS','SUPPORT'][i]}</small><div>{g.map(([label,Icon,target])=><button key={label} onClick={()=>target.toLowerCase().includes('notifications')||target==='rewards'||target==='help'?open(target):notify(`${label} opened`)}><span><Icon/></span><b>{label}</b><ChevronRight/></button>)}</div></section>)}<button className="sign-out">Sign out</button><p className="version">Tankua for Telegram · v1.0</p></div>; }
function SimplePage({title,back,icon:Icon,text}) { return <div className="simple-page"><header className="simple-head"><button onClick={back}><ArrowLeft/></button><h1>{title}</h1><span/></header><div className="empty"><span><Icon/></span><h2>{title}</h2><p>{text}</p></div></div>; }
