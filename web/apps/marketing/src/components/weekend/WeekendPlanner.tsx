"use client";

import { useState } from "react";
import { durationLabels, moodLabels, OutingCard } from "./OutingCard";
import { filterWeekendPlans, type WeekendPlan } from "@/lib/weekend-plans";

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
    <section id="browse" aria-labelledby="planner-heading" className="field-wrap field-catalog">
      <h2 id="planner-heading" className="field-display">Outings from Addis</h2>
      <div className="field-filters field-filters--weekend" role="search" aria-label="Filter outings">
        <label>
          <span>Time available</span>
          <select value={duration} onChange={(event) => setDuration(event.target.value as typeof duration)}>
            <option value="">Any length</option>
            {Object.entries(durationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Interest</span>
          <select value={mood} onChange={(event) => setMood(event.target.value as typeof mood)}>
            <option value="">Any interest</option>
            {Object.entries(moodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field-weekend-budget">
          <span>Maximum entry budget (ETB)</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            aria-describedby="planner-budget-scope"
            value={budget}
            placeholder="Any amount"
            onChange={(event) => setBudget(event.target.value)}
          />
        </label>
        <p id="planner-budget-scope" className="field-filter-note">
          Based on published adult admission prices for domestic visitors. Allow extra for transport and food.
        </p>
      </div>

      <div className="field-results-bar">
        <p role="status">{results.length} {results.length === 1 ? "outing" : "outings"}</p>
        {hasFilters && (
          <button type="button" onClick={reset} className="field-link">Clear filters</button>
        )}
      </div>
      {results.length > 0 ? (
        <div className="field-cards">
          {results.map((plan) => <OutingCard key={plan.slug} plan={plan} />)}
        </div>
      ) : (
        <div className="field-empty">
          <p>No outings match. Try a different interest, time, or budget.</p>
          <button type="button" onClick={reset} className="field-button">Clear filters</button>
        </div>
      )}
    </section>
  );
}
