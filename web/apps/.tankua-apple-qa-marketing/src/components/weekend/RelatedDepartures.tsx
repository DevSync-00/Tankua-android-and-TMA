"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@tankua/ui";
import { getTours } from "@/lib/queries";

type Tour = Awaited<ReturnType<typeof getTours>>["tours"][number];

export function RelatedDepartures({ search }: { search: string }) {
  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    let ignore = false;
    getTours({ search, limit: 5, bookableOnly: true }).then((result) => {
      if (!ignore) setTours(result.tours);
    });
    return () => { ignore = true; };
  }, [search]);

  if (tours.length === 0) return null;

  return (
    <section aria-labelledby="related-departures" className="rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-6">
      <h2 id="related-departures" className="text-xl font-bold">Nearby Tankua departures</h2>
      <ul className="mt-3 divide-y divide-[#e9e6da]">
        {tours.map((tour) => (
          <li key={tour.id}>
            <Link href={`/tours/${tour.id}`} className="flex items-center justify-between gap-3 py-3 text-sm font-medium hover:underline">
              <span>
                {tour.name}
                {tour.price !== null && <span className="mt-0.5 block text-xs text-[#53574b]">{formatCurrency(tour.price, tour.currency)} per person</span>}
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
