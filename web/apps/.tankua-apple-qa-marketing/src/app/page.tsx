import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { HomeDepartures } from "@/components/HomeDepartures";
import { WeekendPhoto } from "@/components/WeekendPhoto";

const destinations = [
  { name: "Simien Mountains", region: "Amhara", image: "/siemen.jpg" },
  { name: "Danakil Depression", region: "Afar", image: "/images/pexels-atypeek-12131129.jpg" },
  { name: "Lake Tana", region: "Amhara", image: "/images/pexels-lovetosmile-5034469.jpg" },
];

export default function HomePage() {
  return (
    <main className="tankua-home">
      <section className="home-hero" aria-labelledby="home-title" data-enter>
        <div className="tankua-wrap home-hero-grid">
          <div className="home-hero-copy">
            <h1 id="home-title">See Ethiopia<br className="home-hero-break" /> with local guides.</h1>
            <p>Find tours run by Ethiopian operators, from the rock-hewn churches of Lalibela to the trails of the Simien Mountains.</p>
            <form action="/tours" className="home-search" role="search" aria-label="Find a tour">
              <label htmlFor="home-tour-search">Where do you want to go?</label>
              <div className="home-search-controls">
                <div className="home-search-field">
                  <Search size={20} aria-hidden="true" />
                  <input id="home-tour-search" type="search" name="q" placeholder="e.g. Lalibela" />
                </div>
                <button type="submit" className="tankua-button">Find tours <ArrowRight size={17} aria-hidden="true" /></button>
              </div>
            </form>
            <Link href="/tours" className="tankua-text-link">Browse all tours <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <Link href="/tours?q=Lalibela" className="home-hero-photo" aria-label="Find tours in Lalibela">
            <Image
              src="/images/pexels-ludo-van-den-nouweland-214324419-12344920.jpg"
              alt="A visitor sits on a stone ledge in Lalibela's rock-cut churches"
              fill
              priority
              sizes="(max-width: 820px) 100vw, 52vw"
            />
            <span className="home-photo-link">Lalibela, North Wollo <ArrowUpRight size={17} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>

      <section className="home-destinations" aria-labelledby="home-destinations-title">
        <div className="tankua-wrap">
          <div className="home-section-heading">
            <h2 id="home-destinations-title">Where to go in Ethiopia</h2>
            <Link href="/destinations" className="tankua-text-link">All destinations <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="home-destination-grid">
            {destinations.map((destination) => (
              <Link key={destination.name} href={`/tours?q=${encodeURIComponent(destination.name)}`} className="home-destination">
                <Image src={destination.image} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 950px) 50vw, 33vw" />
                <div className="home-destination-label">
                  <div>
                    <h3>{destination.name}</h3>
                    <p>{destination.region}</p>
                  </div>
                  <span className="home-destination-arrow"><ArrowUpRight size={20} aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-weekend" aria-labelledby="home-weekend-title">
        <div className="tankua-wrap home-weekend-grid">
          <WeekendPhoto />
          <div className="home-weekend-copy">
            <h2 id="home-weekend-title">A weekend in Addis</h2>
            <p>Find a morning outing, a full day in the city, or an overnight trip. Share a poll so everyone can pick a plan.</p>
            <Link href="/weekend" className="tankua-button">Plan a weekend <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <HomeDepartures />

      <section className="home-guide" aria-labelledby="home-guide-title">
        <div className="tankua-wrap home-guide-grid">
          <div>
            <h2 id="home-guide-title">Good to know before you go</h2>
            <p>Read up on Ethiopian food, the coffee ceremony, and the local calendar.</p>
            <Link href="/guides" className="tankua-text-link">Read travel guides <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <Link href="/guides/ethiopian-coffee-ceremony-guide" className="home-guide-feature">
            <div className="home-guide-photo"><Image src="/images/ethiopian-coffee-ceremony.jpg" alt="" fill sizes="(max-width: 660px) 30vw, 200px" /></div>
            <div className="home-guide-label">
              <h3>The Ethiopian coffee ceremony</h3>
              <ArrowUpRight size={21} aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
