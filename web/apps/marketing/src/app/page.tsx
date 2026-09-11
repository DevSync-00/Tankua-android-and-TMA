"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
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

const PROVIDER_URL = "https://provider.tankua.co";

const fallbackTours = [
  { id: 1, name: "Lalibela Rock-Hewn Heritage Tour", location: "Lalibela, Amhara", category: "Heritage", image: "/images/pexels-ludo-van-den-nouweland-214324419-12344920.jpg", rating: 4.9, reviews: 284, price: 3200 },
  { id: 2, name: "Simien Mountains Trekking Adventure", location: "Debark, Amhara", category: "Adventure", image: "/images/pexels-malaydi-7941708.jpg", rating: 4.8, reviews: 189, price: 4800 },
  { id: 3, name: "Lake Tana & Blue Nile Falls", location: "Bahir Dar, Amhara", category: "Nature", image: "/images/pexels-lovetosmile-5034469.jpg", rating: 4.7, reviews: 216, price: 1800 },
  { id: 4, name: "Danakil Depression Expedition", location: "Afar Region", category: "Expedition", image: "/images/pexels-atypeek-12131129.jpg", rating: 4.9, reviews: 124, price: 9500 },
];

const destinations = [
  { name: "Lalibela", line: "Living heritage carved in stone", image: "/images/pexels-ludo-van-den-nouweland-214324419-12344920.jpg", href: "/tours?q=Lalibela", className: "md:col-span-2 md:row-span-2" },
  { name: "Danakil", line: "Earth at its most elemental", image: "/images/pexels-atypeek-12131129.jpg", href: "/tours?q=Danakil", className: "" },
  { name: "Lake Tana", line: "Island monasteries and open water", image: "/images/pexels-lovetosmile-5034469.jpg", href: "/tours?q=Lake%20Tana", className: "" },
];

type Tour = (typeof fallbackTours)[number];

function formatPrice(price: number) {
  return `ETB ${Number(price).toLocaleString()}`;
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

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/tours?q=${encodeURIComponent(value)}` : "/tours");
  };

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-[#181714]">
      <section className="relative min-h-[780px] overflow-hidden bg-[#1c2119] text-white">
        <Image
          src="/images/beautiful-woman-with-backpack-smiling-holding-binoculars.jpg"
          alt="Traveler exploring Ethiopia"
          fill
          priority
          className="object-cover object-[62%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,18,13,.92)_0%,rgba(15,18,13,.72)_35%,rgba(15,18,13,.14)_72%,rgba(15,18,13,.05)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/45 to-transparent" />

        <nav className="relative z-30 border-b border-white/15">
          <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
            <Link href="/" className="flex items-center gap-3" aria-label="Tankua home">
              <Image src="/favicon.png" alt="" width={38} height={38} className="rounded-[10px] bg-[#ffb800] p-1" />
              <span className="text-xl font-extrabold tracking-[-.03em]">Tankua</span>
            </Link>
            <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
              <Link href="/tours" className="transition hover:text-[#ffc83d]">Explore</Link>
              <Link href="/destinations" className="transition hover:text-[#ffc83d]">Destinations</Link>
              <a href={PROVIDER_URL} className="transition hover:text-[#ffc83d]">For providers</a>
              <Link href="/about" className="transition hover:text-[#ffc83d]">About</Link>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 border border-white/35 px-4 text-sm font-semibold transition hover:bg-white hover:text-[#181714]">
                <Send className="h-4 w-4" /> Telegram
              </a>
              <Link href="/login" className="inline-flex h-11 items-center bg-[#ffb800] px-5 text-sm font-bold text-[#181714] transition hover:bg-[#ffc83d]">Sign in</Link>
            </div>
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center md:hidden" aria-label="Toggle menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
          {menuOpen && (
            <div className="absolute inset-x-0 top-20 border-t border-white/10 bg-[#151713]/98 p-5 md:hidden">
              <div className="grid gap-1 text-base font-semibold">
                <Link href="/tours" className="px-3 py-3" onClick={() => setMenuOpen(false)}>Explore tours</Link>
                <Link href="/destinations" className="px-3 py-3" onClick={() => setMenuOpen(false)}>Destinations</Link>
                <a href={PROVIDER_URL} className="px-3 py-3">For providers</a>
                <Link href="/about" className="px-3 py-3" onClick={() => setMenuOpen(false)}>About</Link>
                <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center justify-center gap-2 bg-[#ffb800] px-4 py-3 text-[#181714]"><Send className="h-4 w-4" /> Open in Telegram</a>
              </div>
            </div>
          )}
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[700px] max-w-[1440px] items-center px-5 pb-36 pt-20 sm:px-8 lg:px-12">
          <div className="max-w-[680px]">
            <p className="mb-6 text-xs font-bold uppercase tracking-[.24em] text-[#ffc83d]">Travel Ethiopia differently</p>
            <h1 className="text-[3.5rem] font-extrabold leading-[.96] tracking-[-.055em] sm:text-7xl lg:text-[5.6rem]">
              Go beyond<br />the expected.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/78 sm:text-xl">
              Remarkable journeys across Ethiopia, led by trusted local providers and made simple from discovery to ticket.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link href="/tours" className="inline-flex h-14 items-center gap-3 bg-[#ffb800] px-7 font-bold text-[#181714] transition hover:bg-[#ffc83d]">Explore journeys <ArrowRight className="h-5 w-5" /></Link>
              <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center gap-2 px-1 font-semibold text-white underline decoration-white/35 underline-offset-8 hover:decoration-white"><Send className="h-4 w-4" /> Open the Mini App</a>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20">
          <form onSubmit={handleSearch} className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid bg-white text-[#181714] shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-20 items-center gap-4 px-5 sm:px-7">
                <Search className="h-6 w-6 shrink-0 text-[#a97400]" />
                <span className="sr-only">Search Ethiopia</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a place, city, or experience" className="w-full bg-transparent text-base font-medium outline-none placeholder:font-normal placeholder:text-[#807a70] sm:text-lg" />
              </label>
              <button type="submit" className="m-2 min-h-14 bg-[#181714] px-8 font-bold text-white transition hover:bg-[#33302a]">Search</button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#9a6900]">Start with a place</p>
            <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">Ethiopia opens up one journey at a time.</h2>
          </div>
          <Link href="/destinations" className="inline-flex items-center gap-2 font-bold">All destinations <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid min-h-[680px] gap-4 md:grid-cols-4 md:grid-rows-2">
          {destinations.map((destination) => (
            <Link key={destination.name} href={destination.href} className={`group relative min-h-80 overflow-hidden bg-[#24221d] ${destination.className}`}>
              <Image src={destination.image} alt={destination.name} fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{destination.name}</h3>
                <p className="mt-1 text-sm text-white/72">{destination.line}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#ffc83d]">Explore <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
          <div className="flex min-h-80 flex-col justify-between bg-[#ffb800] p-7 sm:p-9">
            <span className="text-xs font-bold uppercase tracking-[.2em]">Not sure where to start?</span>
            <div><h3 className="text-3xl font-extrabold leading-tight tracking-[-.04em]">Find a journey that fits you.</h3><Link href="/tours" className="mt-6 inline-flex items-center gap-2 border-b-2 border-[#181714] pb-1 font-bold">Browse all trips <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>

      <section className="bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div><p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#9a6900]">Bookable now</p><h2 className="text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">Journeys travelers love</h2></div>
            <Link href="/tours" className="hidden items-center gap-2 font-bold sm:inline-flex">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {tours.map((tour) => (
              <Link key={tour.id} href={`/tours/${tour.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#e8e4dc]">
                  <Image src={tour.image} alt={tour.name} fill className="object-cover transition duration-500 group-hover:scale-[1.035]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  <span className="absolute left-4 top-4 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em]">{tour.category}</span>
                </div>
                <div className="pt-5">
                  <div className="flex items-center justify-between gap-4 text-sm text-[#6f6a61]"><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#a97400]" />{tour.location}</span><span className="flex items-center gap-1 font-bold text-[#181714]"><Star className="h-4 w-4 fill-[#ffb800] text-[#ffb800]" />{Number(tour.rating).toFixed(1)}</span></div>
                  <h3 className="mt-3 text-xl font-extrabold leading-7 tracking-[-.02em] group-hover:underline group-hover:decoration-[#ffb800] group-hover:decoration-2 group-hover:underline-offset-4">{tour.name}</h3>
                  <p className="mt-3 text-sm text-[#6f6a61]">From <strong className="text-base text-[#181714]">{formatPrice(tour.price)}</strong> per person</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#192019] py-24 text-white">
        <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:px-12">
          <div><p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-[#ffc83d]">Travel with confidence</p><h2 className="text-4xl font-extrabold leading-tight tracking-[-.04em] sm:text-5xl">Local expertise.<br />Clear booking.<br />Real support.</h2></div>
          <div className="grid gap-px bg-white/15 sm:grid-cols-2">
            {[
              [ShieldCheck, "Verified providers", "Book with vetted Ethiopian travel operators."],
              [CalendarDays, "Transparent departures", "See the date, provider, pickup, and availability."],
              [TicketCheck, "Digital tickets", "Keep confirmed trip details ready on your phone."],
              [Check, "Secure checkout", "Prices and availability are checked before payment."],
            ].map(([Icon, title, copy]) => {
              const ItemIcon = Icon as typeof ShieldCheck;
              return <div key={title as string} className="bg-[#192019] p-7 sm:p-9"><ItemIcon className="mb-7 h-7 w-7 text-[#ffc83d]" /><h3 className="text-xl font-extrabold">{title as string}</h3><p className="mt-3 leading-7 text-white/62">{copy as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#ffb800] py-20">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-12">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[.22em]">For Ethiopian travel businesses</p><h2 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-[-.04em]">Bring your journeys to travelers across Tankua.</h2></div>
          <a href={`${PROVIDER_URL}/register`} className="inline-flex h-14 shrink-0 items-center justify-center gap-3 bg-[#181714] px-7 font-bold text-white transition hover:bg-[#33302a]">Join as a provider <ArrowRight className="h-5 w-5" /></a>
        </div>
      </section>

      <section className="bg-[#f7f5f0] py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
          <Send className="mb-7 h-9 w-9 text-[#229ed9]" />
          <h2 className="text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">Tankua is ready inside Telegram.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#655f56]">Explore destinations and continue your journey without installing another app.</p>
          <a href={TELEGRAM_MINI_APP_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-14 items-center gap-3 bg-[#229ed9] px-7 font-bold text-white transition hover:bg-[#178bc2]">Open Telegram Mini App <ArrowRight className="h-5 w-5" /></a>
        </div>
      </section>

      <footer className="bg-[#121410] py-14 text-white/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="flex items-center gap-3 font-extrabold text-white"><Image src="/favicon.png" alt="" width={32} height={32} className="rounded-lg" />Tankua</div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm"><Link href="/tours">Explore</Link><Link href="/about">About</Link><Link href="/contact">Support</Link><a href={PROVIDER_URL}>Provider portal</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <p className="text-sm">© {new Date().getFullYear()} Tankua</p>
        </div>
      </footer>
    </main>
  );
}
