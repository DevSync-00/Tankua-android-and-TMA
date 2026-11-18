import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { OutingCard } from "@/components/weekend/OutingCard";
import { createPageMetadata } from "@/lib/seo";
import { formatWeekendDate } from "@/lib/weekend-dates";
import { loadWeekendEvents } from "@/lib/weekend-events";
import { getAddisWeekend, getWeekendPicks } from "@/lib/weekend-plans";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "This Weekend in Addis Ababa",
  description: "Find dated events and curated outings for this weekend in Addis Ababa. Check venues, dates, and organizer details.",
  path: "/weekend/this-weekend",
});

export default async function ThisWeekendPage() {
  const now = new Date();
  const { saturday, sunday } = getAddisWeekend(now);
  const dateLabel = { weekday: "short", month: "short", day: "numeric" } as const;
  const events = await loadWeekendEvents(now);
  const picks = getWeekendPicks(now);

  return (
    <main className="min-h-screen bg-[#fbfaf5] px-5 pb-16 pt-28 text-[#20251d] sm:px-8 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <Link href="/weekend" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5a48] hover:underline">
          <ArrowLeft size={17} aria-hidden="true" /> Weekend planner
        </Link>
        <header className="mb-8 mt-5 rounded-2xl bg-[#263a2b] px-6 py-8 text-white sm:px-9 sm:py-11">
          <p className="inline-flex items-center gap-2 font-semibold text-[#ffe09a]">
            <CalendarDays size={19} aria-hidden="true" /> {formatWeekendDate(saturday, dateLabel)} – {formatWeekendDate(sunday, dateLabel)}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">This Weekend in Addis</h1>
        </header>

        <section aria-labelledby="dated-events">
          <h2 id="dated-events" className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h2>
          {events.length > 0 ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {events.map((event) => (
                <li key={event.slug} className="flex flex-col rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-6">
                  <p className="text-sm font-semibold text-[#53604b]">
                    {formatWeekendDate(event.startDate, dateLabel)}
                    {event.endDate && event.endDate !== event.startDate && ` – ${formatWeekendDate(event.endDate, dateLabel)}`}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">{event.title}</h3>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#444b42]"><MapPin size={15} aria-hidden="true" /> {event.location}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#444b42]">{event.description}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[#4e613e]">
                    <a className="inline-flex items-center gap-1 underline underline-offset-4" href={event.source.url} target="_blank" rel="noopener noreferrer">
                      {event.source.label} <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                    {event.mapUrl && <a className="underline underline-offset-4" href={event.mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Map for ${event.location}`}>View map</a>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-[#dfdbce] bg-white px-5 py-4 text-sm text-[#53574b]">
              No verified events are listed for these dates. See the weekend picks below for ideas.
            </p>
          )}
        </section>

        <section aria-labelledby="weekend-picks" className="mt-11">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="weekend-picks" className="text-2xl font-bold tracking-tight sm:text-3xl">Weekend picks</h2>
            <Link href="/weekend#browse" className="text-sm font-semibold text-[#4e613e] underline underline-offset-4">Browse all outings</Link>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((plan) => <OutingCard key={plan.slug} plan={plan} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
