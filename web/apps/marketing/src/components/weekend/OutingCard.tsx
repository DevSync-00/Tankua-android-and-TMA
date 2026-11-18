import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { WeekendPlan } from "@/lib/weekend-plans";

export const durationLabels = {
  "half-day": "Half day",
  "full-day": "Full day",
  overnight: "Overnight",
};

export const moodLabels = {
  culture: "Culture",
  nature: "Nature",
  food: "Food",
  family: "Family",
};

export function OutingCard({ plan }: { plan: WeekendPlan }) {
  return (
    <article className="group h-full">
      <Link
        href={`/weekend/outings/${plan.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfdbce] bg-white transition hover:border-[#b1954c] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {plan.image && (
          <div className="relative aspect-[16/10] overflow-hidden bg-[#e9e4d8]">
            <Image
              src={plan.image}
              alt={plan.imageAlt || ""}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-[#53574b]">
            <span className="inline-flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" />{plan.area}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={15} aria-hidden="true" />{durationLabels[plan.duration]}</span>
          </p>
          <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight text-[#20251d]">{plan.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-[#50554c]">{plan.description}</p>
          <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#efebe1] pt-4">
            <span className="text-sm font-semibold text-[#495447]">
              {plan.budgetEtb !== null
                ? plan.budgetEtb === 0 ? "Free entry" : `Listed entry · ETB ${plan.budgetEtb.toLocaleString("en-ET")}`
                : moodLabels[plan.mood]}
            </span>
            <ArrowUpRight size={18} className="shrink-0 text-[#655025]" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
