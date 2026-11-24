"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Share2, Star, UsersRound } from "lucide-react";
import { formatCurrency, RichText, type TripPromotionChannel } from "@tankua/ui";
import { formatDepartureDate } from "@/lib/departure-date";
import type { getTourById } from "@/lib/queries";
import { getTelegramTripUrl } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";

type Props = {
  tour: NonNullable<Awaited<ReturnType<typeof getTourById>>>;
  from: string | null;
  channel: TripPromotionChannel | null;
};

export default function TourDetail({ tour, from, channel }: Props) {
  const { id } = tour;
  const [imageFailed, setImageFailed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [backHref, setBackHref] = useState(from ?? "/tours");

  useEffect(() => {
    if (from) return;
    try {
      const [href, , tourId] = JSON.parse(sessionStorage.getItem("tankua-catalog-return") ?? "[]");
      if (tourId === id && typeof href === "string" && (href === "/tours" || href.startsWith("/tours?"))) {
        setBackHref(href);
      }
    } catch {
      // The default catalog link works without session storage.
    }
  }, [from, id]);

  useEffect(() => {
    if (!channel || !window.crypto?.randomUUID) return;
    const key = `tankua-promotion:${id}:${channel}`;
    let visitId = window.crypto.randomUUID();
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) visitId = saved as typeof visitId;
      else sessionStorage.setItem(key, visitId);
    } catch {
      // The anonymous page view still works when storage is unavailable.
    }
    void supabase.rpc("record_trip_promotion_visit", { p_trip_id: id, p_channel: channel, p_visit_id: visitId }).then(() => {});
  }, [channel, id]);

  async function shareTour() {
    const address = new URL(window.location.pathname, window.location.origin);
    if (channel) address.searchParams.set("channel", channel);
    const url = address.toString();
    setShareStatus("");

    if (navigator.share) {
      try {
        await navigator.share({ title: tour.name, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Tour link copied.");
    } catch {
      setShareUrl(url);
      setShareStatus("Select the link below to copy it.");
    }
  }

  return (
    <main className="field-page">
      <div className="field-wrap py-7 sm:py-10">
        <Link href={backHref} className="field-link" scroll={false}><ArrowLeft size={17} aria-hidden="true" />Back to tours</Link>
      <div className="mt-5 grid overflow-hidden rounded-xl border border-[var(--field-line)] bg-[#fffefa] md:grid-cols-[6fr_5fr]">
        <div className="field-card-image min-h-[15rem] md:aspect-auto">
          {imageFailed ? <MapPin size={34} aria-hidden="true" /> : (
            <Image
              src={tour.image}
              alt=""
              fill
              priority
              sizes="(max-width: 767px) 100vw, 49vw"
              unoptimized={tour.image.startsWith("http")}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <section className="px-6 py-8 sm:px-9 sm:py-11" aria-labelledby="tour-heading">
          <h1 id="tour-heading" className="field-display field-display--detail">{tour.name}</h1>
          <p className="field-card-meta mt-4">
            <span><MapPin size={16} aria-hidden="true" />{tour.location}</span>
            {tour.provider && <span>{tour.provider.name}</span>}
          </p>
          {tour.providerReviews && (
            <p className="field-card-rating mt-3">
              <Star size={16} aria-hidden="true" />
              <strong>{tour.providerReviews.rating.toFixed(1)}</strong>
              <span>({tour.providerReviews.count} provider {tour.providerReviews.count === 1 ? "review" : "reviews"})</span>
            </p>
          )}
          <dl className="mt-6 space-y-3 border-t border-[var(--field-line)] pt-5 text-sm">
            {tour.departureDate && (
              <div className="flex items-baseline gap-2">
                <CalendarDays size={16} aria-hidden="true" className="shrink-0 self-center" />
                <dt>Departure</dt>
                <dd className="ml-auto text-right font-semibold">
                  <time dateTime={tour.departureDate}>
                    {formatDepartureDate(tour.departureDate, true)}
                  </time>
                </dd>
              </div>
            )}
            {tour.durationMinutes !== null && (
              <div className="flex items-baseline gap-2">
                <Clock3 size={16} aria-hidden="true" className="shrink-0 self-center" />
                <dt>Duration</dt>
                <dd className="ml-auto text-right font-semibold">{tour.durationMinutes} minutes</dd>
              </div>
            )}
            {tour.tripType && (
              <div className="flex items-baseline gap-2">
                <UsersRound size={16} aria-hidden="true" className="shrink-0 self-center" />
                <dt>Trip type</dt>
                <dd className="ml-auto text-right font-semibold capitalize">{tour.tripType.replaceAll("_", " ")}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <div className="grid gap-9 py-9 sm:py-12 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)] lg:gap-14">
        <aside className="rounded-xl border border-[var(--field-line)] bg-[var(--field-wash)] p-6 sm:p-7 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start" aria-labelledby="booking-heading">
          <h2 id="booking-heading" className="text-lg font-semibold">Booking</h2>
          <p className="mt-3 text-sm text-[var(--field-muted)]">
            {tour.price !== null ? <><strong className="text-xl tabular-nums text-[var(--field-ink)]">{formatCurrency(tour.price, tour.currency)}</strong> {tour.currency === "USD" ? "USD per person" : "per person"}</> : "Price unavailable"}
          </p>
          {tour.interest ? (
            <div className="mt-4">
              <p className="field-card-interest">Planned departure</p>
              <p className="mt-2 text-sm leading-6 text-[var(--field-muted)]">Reservations open once the minimum group size is met. Registering interest is free.</p>
              <a href={getTelegramTripUrl(tour.id, channel)} className="field-button mt-4 w-full justify-between">Register interest in Telegram<ArrowUpRight size={17} aria-hidden="true" /></a>
            </div>
          ) : tour.bookingOpen ? (
            <div className="mt-4">
              <a href={getTelegramTripUrl(tour.id, channel)} className="field-button w-full justify-between">{tour.paymentOpen ? "Book in Telegram" : "Reserve in Telegram"}<ArrowUpRight size={17} aria-hidden="true" /></a>
              <p className="mt-3 text-sm leading-6 text-[var(--field-muted)]">
                {tour.paymentOpen ? "Choose your pickup and seats, then continue to payment in Telegram." : "Reserve your seat now. Payment opens when the operator confirms the trip."}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-[var(--field-muted)]">{tour.soldOut ? "This departure is sold out." : "This departure is unavailable for booking."}</p>
              <Link href="/tours" className="field-link">Browse upcoming tours</Link>
            </div>
          )}
          <button type="button" className="field-link mt-2" onClick={shareTour}><Share2 size={16} aria-hidden="true" />Share this tour</button>
          <p role="status" className="text-sm text-[var(--field-muted)]">{shareStatus}</p>
          {shareUrl && (
            <input
              aria-label="Tour link"
              className="mt-2 w-full rounded border border-[var(--field-line)] bg-[#fffefa] p-2 text-base"
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              readOnly
            />
          )}
        </aside>

        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          {tour.pickups.length > 0 && (
            <section aria-labelledby="pickup-heading" className="rounded-xl border border-[var(--field-line)] bg-[#fffefa] p-5 sm:p-7">
              <h2 id="pickup-heading" className="text-xl font-semibold">Pickup options</h2>
              <ul className="mt-3 divide-y divide-[var(--field-line)]">
                {tour.pickups.map((pickup) => (
                  <li key={pickup.id} className="flex items-start gap-3 py-3 last:pb-0">
                    <MapPin size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{pickup.name}</p>
                      <p className="text-sm text-[var(--field-muted)]">
                        {(pickup.is_address_pickup ? [pickup.city, "Pickup at your address"] : [pickup.address, pickup.city]).filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {pickup.time && <time dateTime={pickup.time.slice(0, 5)} className="shrink-0 text-sm font-medium tabular-nums">{pickup.time.slice(0, 5)} EAT</time>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {tour.description && (
            <section>
              <h2 className="field-display">About the tour</h2>
              <RichText text={tour.description} className="mt-4 max-w-[70ch] leading-7 text-[var(--field-muted)]" headingClassName="text-[var(--field-ink)]" />
            </section>
          )}
          {tour.inclusions.length > 0 && (
            <section className="border-t border-[var(--field-line)] pt-7">
              <h2 className="field-display">What’s included</h2>
              <ul className="mt-4 space-y-3">
                {tour.inclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <Check size={17} className="mt-1 shrink-0" aria-hidden="true" />{item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {tour.provider && (
            <section className="border-t border-[var(--field-line)] pt-7">
              <h2 className="field-display">Your tour operator</h2>
              <p className="mt-4 font-semibold">{tour.provider.name}</p>
              {tour.provider.description && <p className="mt-2 max-w-[70ch] leading-7 text-[var(--field-muted)]">{tour.provider.description}</p>}
            </section>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
