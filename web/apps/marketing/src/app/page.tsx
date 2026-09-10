"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Compass,
  Heart,
  Map,
  MapPin,
  Menu,
  Search,
  Send,
  ShieldCheck,
  Star,
  TicketCheck,
  X,
} from "lucide-react";
import { getFeaturedTours } from "@/lib/queries";
import { TELEGRAM_MINI_APP_URL } from "@/lib/telegram";

const fallbackTours = [
  { id: 1, name: "Lalibela Rock-Hewn Churches", location: "Lalibela, Amhara", category: "History", image: "/images/pexels-christian-alemu-127251395-30177512.jpg", rating: 4.9, reviews: 492, price: 3200 },
  { id: 2, name: "Simien Mountains Trek", location: "Debark, Amhara", category: "Adventure", image: "/images/pexels-amanuel-fiseha-1532137422-27247762.jpg", rating: 4.8, reviews: 267, price: 4800 },
  { id: 3, name: "Lake Tana & Blue Nile Falls", location: "Bahir Dar, Amhara", category: "Nature", image: "/images/pexels-fanuel-33019023.jpg", rating: 4.7, reviews: 216, price: 1800 },
  { id: 4, name: "Danakil Depression Expedition", location: "Afar", category: "Adventure", image: "/images/pexels-atypeek-12131129.jpg", rating: 4.9, reviews: 298, price: 9500 },
];

const categories = [
  { label: "Historical", value: "historical", icon: "✦" },
  { label: "Nature", value: "nature", icon: "⌁" },
  { label: "Adventure", value: "adventure", icon: "△" },
  { label: "Cultural", value: "cultural", icon: "◎" },
  { label: "Religious", value: "religious", icon: "◇" },
];

type Tour = (typeof fallbackTours)[number];

function money(value: number) {
  return `ETB ${Number(value).toLocaleString()}`;
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tours, setTours] = useState<Tour[]>(fallbackTours);

  useEffect(() => {
    getFeaturedTours(4).then((data) => {
      if (data.length) setTours(data as Tour[]);
    });
  }, []);

  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tours?q=${encodeURIComponent(value)}` : "/tours");
  }

  return (
    <main className="min-h-screen bg-[#fbf8f0] text-[#211b14]">
      <nav className="absolute inset-x-0 top-0 z-30 border-b border-white/15 text-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Tankua home">
            <Image src="/favicon.png" alt="" width={38} height={38} className="rounded-xl bg-[#f5a800] p-1" />
            <span className="text-xl font-extrabold tracking-tight">Tankua</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/tours" className="hover:text-[#ffc43d]">Explore</Link>
            <Link href="/destinations" className="hover:text-[#ffc43d]">Destinations</Link>
            <Link href="/providers" className="hover:text-[#ffc43d]">For providers</Link>
            <Link href="/about" className="hover:text-[#ffc43d]">About</Link>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              <Send className="h-4 w-4" /> Telegram app
            </a>
            <Link href="/login" className="rounded-full bg-[#f5a800] px-5 py-2.5 text-sm font-bold text-[#211b14] hover:bg-[#ffc43d]">Sign in</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center md:hidden" aria-label="Toggle navigation">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="mx-4 rounded-2xl bg-[#211b14] p-5 shadow-2xl md:hidden">
            <div className="grid gap-1 text-base font-semibold">
              {[["Explore tours", "/tours"], ["Destinations", "/destinations"], ["For providers", "/providers"], ["About Tankua", "/about"]].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 hover:bg-white/10">{label}</Link>
              ))}
              <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5a800] px-4 py-3 text-[#211b14]"><Send className="h-4 w-4" /> Open in Telegram</a>
            </div>
          </div>
        )}
      </nav>

      <section className="relative min-h-[760px] overflow-hidden bg-[#211b14]">
        <Image src="/images/beautiful-shot-building-near-forested-mountains.jpg" alt="Ethiopian highlands" fill priority className="object-cover opacity-60" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,19,13,.92)_0%,rgba(25,19,13,.58)_50%,rgba(25,19,13,.18)_100%)]" />
        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-5 pb-20 pt-32 lg:px-8">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold uppercase tracking-[.16em] backdrop-blur">
              <Compass className="h-4 w-4 text-[#ffc43d]" /> Explore Ethiopia with local experts
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-8xl">
              Your next story starts <span className="text-[#ffc43d]">here.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/78 sm:text-xl">Discover remarkable places, compare verified trips, and book trusted local experiences across Ethiopia.</p>

            <form onSubmit={search} className="mt-9 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
              <label className="flex min-h-14 flex-1 items-center gap-3 px-3 text-[#766d62]">
                <Search className="h-5 w-5 text-[#d39200]" />
                <span className="sr-only">Search places and experiences</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Where do you want to go?" className="w-full bg-transparent text-base text-[#211b14] outline-none placeholder:text-[#8c8378]" />
              </label>
              <button type="submit" className="min-h-14 rounded-xl bg-[#f5a800] px-7 font-bold text-[#211b14] transition hover:bg-[#ffc43d]">Search trips</button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/75">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#ffc43d]" /> Verified providers</span>
              <span className="flex items-center gap-2"><TicketCheck className="h-4 w-4 text-[#ffc43d]" /> Secure digital tickets</span>
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#ffc43d]" /> Flexible trips</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 max-w-7xl px-5 lg:px-8" aria-label="Browse categories">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((item) => (
            <Link key={item.value} href={`/tours?category=${item.value}`} className="group flex items-center gap-3 border-b border-r border-black/5 px-5 py-5 transition hover:bg-[#fff7df]">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f5a800]/15 text-xl font-bold text-[#b67900] group-hover:bg-[#f5a800] group-hover:text-white">{item.icon}</span>
              <span className="font-bold">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#b67900]">Popular right now</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Trips worth taking</h2>
          </div>
          <Link href="/tours" className="hidden items-center gap-2 font-bold text-[#8a5c00] hover:text-[#211b14] sm:flex">See all trips <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tours.map((tour) => (
            <article key={tour.id} className="group overflow-hidden rounded-2xl bg-white shadow-[0_12px_45px_rgba(56,42,20,.10)]">
              <Link href={`/tours/${tour.id}`} className="block">
                <div className="relative h-56 overflow-hidden">
                  <Image src={tour.image} alt={tour.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-bold capitalize text-[#211b14]">{tour.category}</span>
                  <button type="button" aria-label={`Save ${tour.name}`} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-[#211b14]" onClick={(event) => event.preventDefault()}><Heart className="h-4 w-4" /></button>
                </div>
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[#766d62]"><MapPin className="h-3.5 w-3.5 text-[#d39200]" />{tour.location}</span>
                    <span className="flex items-center gap-1 font-bold"><Star className="h-3.5 w-3.5 fill-[#f5a800] text-[#f5a800]" />{Number(tour.rating).toFixed(1)}</span>
                  </div>
                  <h3 className="min-h-12 text-lg font-extrabold leading-6">{tour.name}</h3>
                  <div className="mt-5 flex items-end justify-between border-t border-black/8 pt-4">
                    <div><span className="block text-xs text-[#766d62]">From</span><strong className="text-lg">{money(tour.price)}</strong></div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f5a800] transition group-hover:translate-x-1"><ChevronRight className="h-5 w-5" /></span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <Link href="/tours" className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-[#211b14]/15 py-3 font-bold sm:hidden">See all trips <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <section className="bg-[#efe7d6] py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#9b6800]">One journey, every device</p>
            <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">Plan your way. Travel with confidence.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#655b50]">Start on the web, open Tankua instantly in Telegram, or take the full mobile experience with you. Your destination catalogue and trusted providers stay consistent.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ed9] px-6 py-3.5 font-bold text-white hover:bg-[#178bc2]"><Send className="h-5 w-5" /> Open Telegram Mini App</a>
              <Link href="/download" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#211b14]/15 bg-white px-6 py-3.5 font-bold hover:border-[#211b14]/30">Get the mobile app <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Search, "Discover", "Search curated places and experiences across Ethiopia."],
              [Map, "Explore", "Browse by destination, region, category, or map."],
              [ShieldCheck, "Book securely", "Choose verified providers and transparent trip options."],
              [TicketCheck, "Travel", "Keep booking details and digital tickets close at hand."],
            ].map(([Icon, title, copy]) => {
              const FeatureIcon = Icon as typeof Search;
              return <div key={title as string} className="rounded-2xl border border-black/5 bg-white/75 p-6"><FeatureIcon className="mb-5 h-7 w-7 text-[#b67900]" /><h3 className="text-lg font-extrabold">{title as string}</h3><p className="mt-2 leading-6 text-[#6f6559]">{copy as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#211b14] py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#ffc43d]">Ready when you are</p><h2 className="mt-3 text-3xl font-black">Find your next Ethiopian experience.</h2></div>
          <Link href="/tours" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5a800] px-7 py-4 font-bold text-[#211b14] hover:bg-[#ffc43d]">Explore all trips <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>

      <footer className="bg-[#17120d] py-12 text-white/65">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-bold text-white"><Image src="/favicon.png" alt="" width={28} height={28} className="rounded-lg" /> Tankua</div>
          <div className="flex flex-wrap gap-6"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Support</Link><Link href="/providers">Providers</Link></div>
          <p>© {new Date().getFullYear()} Tankua</p>
        </div>
      </footer>
    </main>
  );
}
