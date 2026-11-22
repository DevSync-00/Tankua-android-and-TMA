"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getAddisToday } from "@/lib/weekend-dates";
import { getWeekendPlan, weekendPlans } from "@/lib/weekend-plans";
import { durationLabels } from "./OutingCard";
import { requestWeekendPoll } from "./poll-api";

export function NewWeekendPoll({ initialOuting }: { initialOuting?: string }) {
  const router = useRouter();
  const [outings, setOutings] = useState<string[]>(() => initialOuting && getWeekendPlan(initialOuting) ? [initialOuting] : []);
  const [dates, setDates] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleOuting(slug: string) {
    setOutings((current) => current.includes(slug)
      ? current.filter((value) => value !== slug)
      : current.length < 3 ? [...current, slug] : current);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const selectedDates = dates.filter(Boolean);
    if (outings.length < 2 || selectedDates.length < 2 || new Set(selectedDates).size !== selectedDates.length) {
      setError("Choose at least two outings and two different dates.");
      return;
    }
    if (selectedDates.some((date) => date < getAddisToday())) {
      setError("Choose today or a future date in Addis Ababa.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const poll = await requestWeekendPoll("", {
        method: "POST",
        body: JSON.stringify({ outingSlugs: outings, dates: selectedDates }),
      });
      router.push(`/weekend/polls/${encodeURIComponent(poll.id)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the poll. Try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <fieldset disabled={saving} className="rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-6">
        <legend className="sr-only">Outing choices</legend>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">Choose two or three outings</h2>
          <span className="text-sm font-semibold text-[#53574b]" aria-live="polite">{outings.length} selected</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {weekendPlans.map((plan) => {
            const selected = outings.includes(plan.slug);
            return (
              <label key={plan.slug} className={`flex min-h-16 items-start gap-3 rounded-lg border p-3 ${selected ? "border-[#6c815e] bg-[#f0f3e9]" : "border-[#dedfd3]"}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!selected && outings.length === 3}
                  onChange={() => toggleOuting(plan.slug)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#496447]"
                />
                <span>
                  <span className="block text-sm font-semibold">{plan.title}</span>
                  <span className="mt-0.5 block text-xs text-[#53574b]">{plan.area} · {durationLabels[plan.duration]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={saving} className="rounded-2xl border border-[#dfdbce] bg-white p-5 sm:p-6">
        <legend className="sr-only">Date choices</legend>
        <h2 className="text-xl font-bold">Suggest dates</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {dates.map((date, index) => (
            <label key={index} className="text-sm font-semibold text-[#343b32]">
              {["First date", "Second date", "Third date (optional)"][index]}
              <input
                type="date"
                required={index < 2}
                min={getAddisToday()}
                value={date}
                className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-[#d7d8ca] bg-white px-3 text-base text-[#20251d]"
                onChange={(event) => {
                  const value = event.target.value;
                  setDates((current) => current.map((currentDate, position) => position === index ? value : currentDate));
                }}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="rounded-lg border border-[#e5bdb0] bg-[#fff5f1] p-3 text-sm font-medium text-[#73352a]">{error}</p>}
      <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#ffcb54] px-5 font-bold hover:bg-[#ffda7e] disabled:opacity-60">
        {saving ? "Creating poll…" : "Create poll"} <ArrowRight size={17} aria-hidden="true" />
      </button>
    </form>
  );
}
