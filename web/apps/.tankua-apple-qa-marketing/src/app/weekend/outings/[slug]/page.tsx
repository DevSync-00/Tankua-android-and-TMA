import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3, MapPin, UsersRound } from "lucide-react";
import { durationLabels, moodLabels } from "@/components/weekend/OutingCard";
import { RelatedDepartures } from "@/components/weekend/RelatedDepartures";
import { SharePlanActions } from "@/components/weekend/SharePlanActions";
import { createPageMetadata } from "@/lib/seo";
import { getWeekendPlan, weekendPlans } from "@/lib/weekend-plans";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return weekendPlans.map((plan) => ({ slug: plan.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const plan = getWeekendPlan(params.slug);
  if (!plan) return { title: "Outing unavailable", robots: { index: false } };
  const metadata = createPageMetadata({
    title: plan.title,
    description: plan.description,
    path: `/weekend/outings/${plan.slug}`,
  });
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: plan.image ? [{ url: plan.image, alt: plan.imageAlt }] : undefined },
  };
}

export default function OutingPage({ params }: Props) {
  const plan = getWeekendPlan(params.slug);
  if (!plan) notFound();

  return (
    <main className="field-page px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <Link href="/weekend" className="field-link">
          <ArrowLeft size={17} aria-hidden="true" /> Weekend planner
        </Link>
        <header className="mb-7 mt-5 grid overflow-hidden rounded-2xl border border-[#dfdbce] bg-white lg:grid-cols-2">
          <div className="p-6 sm:p-9 lg:py-11">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-[#53574b]">
              <span className="inline-flex items-center gap-1.5"><MapPin size={16} aria-hidden="true" />{plan.area}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={16} aria-hidden="true" />{durationLabels[plan.duration]}</span>
              <span>{moodLabels[plan.mood]}</span>
            </p>
            <h1 className="field-display field-display--detail mt-4">{plan.title}</h1>
            <p className="mt-4 text-base leading-7 text-[#444b42] sm:text-lg">{plan.description}</p>
            <div className="mt-6">
              <SharePlanActions path={`/weekend/outings/${plan.slug}`} title={plan.title} />
            </div>
          </div>
          {plan.image && (
            <div className="relative min-h-60 bg-[#e8e4d8] lg:min-h-full">
              <Image src={plan.image} alt={plan.imageAlt || ""} priority fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" />
            </div>
          )}
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="outing-stops" className="rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-7">
            <h2 id="outing-stops" className="text-2xl font-bold tracking-tight">Your stops</h2>
            {plan.timeEstimate && <p className="mt-2 text-sm leading-6 text-[#53574b]">{plan.timeEstimate}</p>}
            <ol className="mt-3 divide-y divide-[#e9e6da]">
              {plan.stops.map((stop, index) => (
                <li key={stop.name} className="flex gap-4 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edeee4] text-sm font-bold text-[#465141]" aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3 className="font-bold">{stop.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#444b42]">{stop.description}</p>
                    <a href={stop.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#4e613e] underline underline-offset-4">
                      Map for {stop.name} <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <aside className="space-y-5">
            <section aria-labelledby="outing-budget" className="rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-6">
              <h2 id="outing-budget" className="text-xl font-bold">Costs and practical tips</h2>
              <p className="mt-3 font-semibold">
                {plan.budgetEtb === null ? "Check prices with the venue" : plan.budgetEtb === 0 ? "Free entry" : `Listed entry · ETB ${plan.budgetEtb.toLocaleString("en-ET")}`}
              </p>
              {plan.budgetNote && <p className="mt-1 text-sm leading-6 text-[#53574b]">{plan.budgetNote}</p>}
              {plan.tips.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[#444b42]">
                  {plan.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              )}
              {plan.sources.length > 0 && (
                <ul aria-label="Outing sources" className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e9e6da] pt-3 text-sm">
                  {plan.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#4e613e] underline underline-offset-4">
                        {source.label} <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <Link
              href={`/weekend/polls/new?outing=${encodeURIComponent(plan.slug)}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#ffcb54] px-5 font-bold hover:bg-[#ffda7e]"
            >
              <UsersRound size={19} aria-hidden="true" /> Plan with friends
            </Link>
            {plan.tourSearch && <RelatedDepartures search={plan.tourSearch} />}
          </aside>
        </div>
      </div>
    </main>
  );
}
