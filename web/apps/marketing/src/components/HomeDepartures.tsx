"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { formatCurrency } from "@tankua/ui";
import { getFeaturedTours } from "@/lib/queries";

type FeaturedTours = Awaited<ReturnType<typeof getFeaturedTours>>;

export function HomeDepartures() {
  const [featured, setFeatured] = useState<FeaturedTours | null>(null);

  useEffect(() => {
    let ignore = false;
    getFeaturedTours().then((data) => {
      if (!ignore) setFeatured(data);
    });
    return () => { ignore = true; };
  }, []);

  return (
    <section className="home-departures" aria-labelledby="home-departures-title">
      <div className="tankua-wrap">
        <div className="home-section-heading">
          <h2 id="home-departures-title">Upcoming tours</h2>
          <Link href="/tours" className="tankua-text-link">See all tours <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        {featured?.tours.length ? (
          <div className="home-departure-grid">
            {featured.tours.map((tour) => (
              <Link key={tour.id} href={`/tours/${tour.id}`} className="home-departure">
                <div className="home-departure-photo">
                  <Image src={tour.image} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 950px) 50vw, 25vw" />
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
                {tour.price !== null && <p><strong>{formatCurrency(tour.price, tour.currency)}</strong> per person</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-departures-status" role="status">
            <p>{!featured ? "Loading upcoming tours…" : featured.error ? "Tour listings couldn’t load. Try again from the tours page." : "No upcoming tours are listed right now."}</p>
            {featured && !featured.error && <Link href="/weekend" className="tankua-text-link">Find an outing in Addis <ArrowRight size={17} aria-hidden="true" /></Link>}
          </div>
        )}
      </div>
    </section>
  );
}
