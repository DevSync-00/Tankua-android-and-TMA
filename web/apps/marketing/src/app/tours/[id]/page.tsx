"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Share2, Star, UsersRound } from "lucide-react";
import { formatCurrency } from "@tankua/ui";
import { formatDepartureDate } from "@/lib/departure-date";
import { getTourById } from "@/lib/queries";
import { getTelegramTripUrl } from "@/lib/telegram";

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Awaited<ReturnType<typeof getTourById>>>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [backHref, setBackHref] = useState("/tours");

  useEffect(() => {
    let ignore = false;
    const from = new URL(window.location.href).searchParams.get("from");
    setBackHref(from === "/tours" || from?.startsWith("/tours?") ? from : "/tours");
    setLoading(true);
    setImageFailed(false);
    setShareStatus("");
    setShareUrl("");

    getTourById(id).then((result) => {
      if (ignore) return;
      setTour(result);
      setLoading(false);
    });

    return () => { ignore = true; };
  }, [id]);

  async function shareTour() {
    if (!tour) return;
    const url = new URL(window.location.pathname, window.location.origin).toString();
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
        {loading ? (
          <div className="field-empty mt-5" role="status">Loading tour details…</div>
        ) : !tour ? (
          <div className="field-empty mt-5">
            <h1 className="field-display text-[var(--field-ink)]">Tour unavailable</h1>
            <p>This tour could not be loaded. You can return to the directory to find another departure.</p>
            <Link href="/tours" className="field-button">Browse tours<ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        ) : (
          <>
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
                  {tour.price !== null ? <><strong className="text-xl tabular-nums text-[var(--field-ink)]">{formatCurrency(tour.price, tour.currency)}</strong> per person</> : "Price unavailable"}
                </p>
                {tour.interest ? (
                  <div className="mt-4">
                    <p className="field-card-interest">Planned departure</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--field-muted)]">Reservations open once the minimum group size is met. Registering interest is free.</p>
                    <a href={getTelegramTripUrl(tour.id)} className="field-button mt-4 w-full justify-between">Register interest in Telegram<ArrowUpRight size={17} aria-hidden="true" /></a>
                  </div>
                ) : tour.bookingOpen ? (
                  <div className="mt-4">
                    <a href={getTelegramTripUrl(tour.id)} className="field-button w-full justify-between">{tour.paymentOpen ? "Book in Telegram" : "Reserve in Telegram"}<ArrowUpRight size={17} aria-hidden="true" /></a>
                    <p className="mt-3 text-sm leading-6 text-[var(--field-muted)]">
                      {tour.paymentOpen ? "Choose a pickup point and seats for this departure in Telegram." : "Reserve your seat now. Payment opens when the operator confirms the trip."}
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
                {tour.description && (
                  <section>
                    <h2 className="field-display">About the tour</h2>
                    <p className="mt-4 max-w-[70ch] whitespace-pre-line leading-7 text-[var(--field-muted)]">{tour.description}</p>
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
          </>
        )}
      </div>
    </main>
  );
}
