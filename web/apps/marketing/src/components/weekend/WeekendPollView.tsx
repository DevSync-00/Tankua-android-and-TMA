"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw, Vote } from "lucide-react";
import { formatWeekendDate, getAddisToday } from "@/lib/weekend-dates";
import { getWeekendPlan } from "@/lib/weekend-plans";
import { SharePlanActions } from "./SharePlanActions";
import { requestWeekendPoll, type WeekendPoll } from "./poll-api";

function PollOption({
  inputName, label, selected, disabled, votes, total, onSelect, details,
}: {
  inputName: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  votes: number;
  total: number;
  onSelect: () => void;
  details?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${selected ? "border-[#6c815e] bg-[#f1f4eb]" : "border-[#dedfd3] bg-white"}`}>
      <label className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-3 text-sm font-semibold">
          <input type="radio" name={inputName} checked={selected} disabled={disabled} onChange={onSelect} className="mt-0.5 h-4 w-4 shrink-0 accent-[#496447]" />
          {label}
        </span>
        <span className="shrink-0 text-sm text-[#53574b]">{votes} {votes === 1 ? "vote" : "votes"}</span>
      </label>
      <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7eade]">
        <div
          className="h-full rounded-full bg-[#64805d]"
          style={{ width: `${total > 0 ? Math.min(100, votes * 100 / total) : 0}%` }}
        />
      </div>
      {details && <div className="mt-2 text-xs text-[#53574b]">{details}</div>}
    </div>
  );
}

export function WeekendPollView({ id }: { id: string }) {
  const apiPath = `/${encodeURIComponent(id)}`;
  const [poll, setPoll] = useState<WeekendPoll | null>(null);
  const [outingSlug, setOutingSlug] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    requestWeekendPoll(apiPath, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setPoll(data);
      setOutingSlug(data.myVote?.outingSlug ?? "");
      setDate(data.myVote?.date ?? "");
    }).catch((error) => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load this poll.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [apiPath]);

  async function refresh() {
    if (loading || saving) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestWeekendPoll(apiPath);
      setPoll(data);
      if (!poll) {
        setOutingSlug(data.myVote?.outingSlug ?? "");
        setDate(data.myVote?.date ?? "");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not refresh this poll.");
    } finally {
      setLoading(false);
    }
  }

  async function vote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving || !outingSlug || !date || date < getAddisToday()) return;
    setError("");
    setSavedMessage("");
    setSaving(true);
    try {
      const data = await requestWeekendPoll(`${apiPath}/vote`, {
        method: "POST",
        body: JSON.stringify({ outingSlug, date }),
      });
      setPoll(data);
      setSavedMessage("Your vote is saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save your vote.");
    } finally {
      setSaving(false);
    }
  }

  if (!poll) {
    return (
      <div className="mt-6 rounded-2xl border border-[#dfdbce] bg-white p-5">
        {loading ? <p role="status">Loading poll…</p> : (
          <>
            <p role="alert" className="text-sm font-semibold text-[#73352a]">{error || "This poll is unavailable."}</p>
            <button type="button" onClick={refresh} className="mt-3 font-semibold text-[#4a5a48] underline">Try again</button>
          </>
        )}
      </div>
    );
  }

  const today = getAddisToday();
  const closed = poll.dates.every((option) => option.date < today);
  const unchanged = poll.myVote?.outingSlug === outingSlug && poll.myVote.date === date;

  return (
    <div className="mt-6">
      <SharePlanActions path={`/weekend/polls/${encodeURIComponent(id)}`} title="Vote on our weekend outing" />
      <div className="my-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p role="status" className="font-semibold text-[#53574b]">{poll.voteCount} {poll.voteCount === 1 ? "person has" : "people have"} voted</p>
        <button type="button" disabled={loading || saving} onClick={refresh} className="inline-flex min-h-10 items-center gap-2 font-semibold text-[#4a5a48] hover:underline disabled:opacity-60">
          <RefreshCw size={15} aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh results"}
        </button>
      </div>
      <form onSubmit={vote}>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset disabled={closed || saving} className="space-y-3">
            <legend className="mb-3 text-xl font-bold">Where should we go?</legend>
            {poll.outings.map((option) => (
              <PollOption
                key={option.slug}
                inputName="outing"
                label={getWeekendPlan(option.slug)?.title ?? option.slug.replaceAll("-", " ")}
                selected={option.slug === outingSlug}
                votes={option.votes}
                total={poll.voteCount}
                onSelect={() => { setOutingSlug(option.slug); setSavedMessage(""); }}
                details={getWeekendPlan(option.slug) && (
                  <Link href={`/weekend/outings/${option.slug}`} className="inline-flex items-center gap-1 font-semibold text-[#4e613e] underline underline-offset-4">
                    View outing <ArrowUpRight size={12} aria-hidden="true" />
                  </Link>
                )}
              />
            ))}
          </fieldset>
          <fieldset disabled={closed || saving} className="space-y-3">
            <legend className="mb-3 text-xl font-bold">When should we go?</legend>
            {poll.dates.map((option) => (
              <PollOption
                key={option.date}
                inputName="date"
                label={formatWeekendDate(option.date)}
                selected={option.date === date}
                disabled={option.date < today}
                votes={option.votes}
                total={poll.voteCount}
                onSelect={() => { setDate(option.date); setSavedMessage(""); }}
                details={option.date < today ? "Past date" : undefined}
              />
            ))}
          </fieldset>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-[#e5bdb0] bg-[#fff5f1] p-3 text-sm font-medium text-[#73352a]">{error}</p>}
        {closed ? (
          <p role="status" className="mt-5 text-sm font-semibold text-[#53574b]">This poll closed after its last date passed.</p>
        ) : (
          <div className="mt-6">
            <button type="submit" disabled={loading || saving || !outingSlug || !date || date < today || unchanged} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#ffcb54] px-5 font-bold hover:bg-[#ffda7e] disabled:opacity-60">
              <Vote size={18} aria-hidden="true" /> {saving ? "Saving…" : poll.myVote ? "Update your vote" : "Submit your vote"}
            </button>
            <p className="mt-2 text-sm text-[#53574b]">One vote per browser. You can change your vote while the poll is open.</p>
          </div>
        )}
        <p aria-live="polite" className="mt-3 text-sm font-semibold text-[#3e5a3e]">{savedMessage}</p>
      </form>
    </div>
  );
}
