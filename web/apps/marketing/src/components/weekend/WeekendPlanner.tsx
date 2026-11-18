"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { durationLabels, moodLabels, OutingCard } from "./OutingCard";
import { filterWeekendPlans, type WeekendPlan } from "@/lib/weekend-plans";

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-[#d7d8ca] bg-white px-3 text-base text-[#20251d] focus:outline focus:outline-2 focus:outline-[#74602d]";

export function WeekendPlanner() {
  const [duration, setDuration] = useState<WeekendPlan["duration"] | "">("");
  const [mood, setMood] = useState<WeekendPlan["mood"] | "">("");
  const [budget, setBudget] = useState("");

  const maxBudgetEtb = budget !== "" && Number.isFinite(Number(budget)) && Number(budget) >= 0
    ? Number(budget)
    : undefined;
  const results = filterWeekendPlans({
    duration: duration || undefined,
    mood: mood || undefined,
    maxBudgetEtb,
  });
  const hasFilters = Boolean(duration || mood || budget);

  function reset() {
    setDuration("");
    setMood("");
    setBudget("");
  }

  return (
    <section id="browse" aria-labelledby="planner-heading" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-8 lg:py-16">
      <h2 id="planner-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">Find an outing</h2>
      <div className="mt-5 rounded-2xl border border-[#dfe0d3] bg-[#f0f2e9] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-[#343b32]">
            Time available
            <select className={inputClass} value={duration} onChange={(event) => setDuration(event.target.value as typeof duration)}>
              <option value="">Any length</option>
              {Object.entries(durationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#343b32]">
            In the mood for
            <select className={inputClass} value={mood} onChange={(event) => setMood(event.target.value as typeof mood)}>
              <option value="">Anything</option>
              {Object.entries(moodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#343b32]">
            Maximum entry budget in ETB
            <input
              type="number"
              min={0}
              inputMode="decimal"
              aria-describedby="planner-budget-scope"
              className={inputClass}
              value={budget}
              placeholder="Any amount"
              onChange={(event) => setBudget(event.target.value)}
            />
          </label>
        </div>
        <p id="planner-budget-scope" className="mt-3 text-sm text-[#53574b]">
          The budget filter uses published domestic-adult admission prices. Allow extra for transport and food.
        </p>
      </div>

      <div className="my-5 flex min-h-6 items-center justify-between gap-3 text-sm">
        <p role="status" className="font-medium text-[#53574b]">{results.length} {results.length === 1 ? "outing" : "outings"}</p>
        {hasFilters && (
          <button type="button" onClick={reset} className="font-semibold text-[#4b4d2c] underline underline-offset-4">Clear filters</button>
        )}
      </div>
      {results.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((plan) => <OutingCard key={plan.slug} plan={plan} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cbcbbb] px-5 py-12 text-center">
          <Compass size={28} className="mx-auto text-[#665224]" aria-hidden="true" />
          <h3 className="mt-3 font-bold">No outings match these filters</h3>
          <p className="mt-2 text-sm text-[#53574b]">Try another mood, a longer outing, or a different budget.</p>
        </div>
      )}
    </section>
  );
}
