"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { formatCurrency } from "@tankua/ui";
import { formatDepartureDate } from "@/lib/departure-date";
import type { getFeaturedTours } from "@/lib/queries";

type FeaturedTours = Awaited<ReturnType<typeof getFeaturedTours>>["tours"];

export function HomeDepartures({ initialTours, initialError }: { initialTours: FeaturedTours; initialError: boolean }) {
  const [featured, setFeatured] = useState<FeaturedTours | "error" | null>(initialError ? "error" : initialTours);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0) return;

    const request = new AbortController();

    async function loadTours() {
      try {
        const response = await fetch("/api/tours/featured", { signal: request.signal });
        if (!response.ok) throw new Error("Featured tours unavailable");
        const { tours } = await response.json() as { tours: FeaturedTours };
        if (!request.signal.aborted) setFeatured(tours);
      } catch {
        if (!request.signal.aborted) setFeatured("error");
      }
    }

    void loadTours();
    return () => request.abort();
  }, [attempt]);

  function retry() {
    setFeatured(null);
    setAttempt((current) => current + 1);
  }

  return (
    <section className="home-departures" aria-labelledby="home-departures-title">
      <div className="tankua-wrap">
        <div className="home-section-heading">
          <h2 id="home-departures-title">Upcoming tours</h2>
          <Link href="/tours" className="tankua-text-link">See all tours <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        {Array.isArray(featured) && featured.length > 0 ? (
          <div className="home-departure-grid">
            {featured.map((tour) => (
              <Link key={tour.id} href={`/tours/${encodeURIComponent(tour.id)}`} className="home-departure">
                <div className="home-departure-photo">
                  <Image src={tour.image} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 950px) 50vw, 25vw" unoptimized={tour.image.startsWith("http")} />
                </div>
                <div className="home-departure-meta">
                  <span><MapPin size={15} aria-hidden="true" />{tour.location}</span>
                  {tour.providerReviews && (
                    <span aria-label={`Provider rating ${tour.providerReviews.rating.toFixed(1)} from ${tour.providerReviews.count} reviews`}>
                      <Star size={15} aria-hidden="true" />{tour.providerReviews.rating.toFixed(1)} ({tour.providerReviews.count})
                    </span>
                  )}
                </div>
                <h3>{tour.name}</h3>
                {tour.departureDate && <p><time dateTime={tour.departureDate}>{formatDepartureDate(tour.departureDate)}</time></p>}
                {tour.interest && <p>Planned departure</p>}
                {tour.price !== null && <p><strong>{formatCurrency(tour.price, tour.currency)}</strong> per person</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-departures-status">
            <p role="status">{featured === null ? "Loading upcoming tours…" : featured === "error" ? "Tour listings couldn’t load." : "No upcoming tours are listed right now."}</p>
            {featured === "error" && <button type="button" className="tankua-text-link" onClick={retry}>Try again</button>}
            {Array.isArray(featured) && <Link href="/weekend" className="tankua-text-link">Find an outing in Addis <ArrowRight size={17} aria-hidden="true" /></Link>}
          </div>
        )}
      </div>
    </section>
  );
}
