import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
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
    <article className="field-card">
      <Link
        href={`/weekend/outings/${plan.slug}`}
        className="field-card-link"
      >
        {plan.image && (
          <div className="field-card-image">
            <Image
              src={plan.image}
              alt={plan.imageAlt || ""}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="field-card-body">
          <h3>{plan.title}</h3>
          <p className="field-card-meta">
            <span><MapPin size={15} aria-hidden="true" />{plan.area}</span>
            <span><Clock3 size={15} aria-hidden="true" />{durationLabels[plan.duration]}</span>
          </p>
          <p className="field-card-description">{plan.description}</p>
          <div className="field-card-end">
            <p>
              {plan.budgetEtb !== null
                ? plan.budgetEtb === 0 ? "Free entry" : `Listed entry · ETB ${plan.budgetEtb.toLocaleString("en-ET")}`
                : moodLabels[plan.mood]}
            </p>
            <span className="field-card-action">View outing<ArrowRight size={17} aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
