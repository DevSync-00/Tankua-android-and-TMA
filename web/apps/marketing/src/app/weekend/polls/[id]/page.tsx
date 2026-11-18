import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WeekendPollView } from "@/components/weekend/WeekendPollView";

export const metadata: Metadata = {
  title: "Vote on a Weekend Outing",
  description: "Choose an outing and a date in your Tankua group poll.",
  robots: { index: false, follow: false },
};

export default function WeekendPollPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(params.id)) notFound();

  return (
    <main className="min-h-screen bg-[#fbfaf5] px-5 pb-16 pt-28 text-[#20251d] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/weekend" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5a48] hover:underline">
          <ArrowLeft size={17} aria-hidden="true" /> Weekend planner
        </Link>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Vote on a weekend outing</h1>
        <p className="mt-3 leading-7 text-[#444b42]">Pick one outing and one date.</p>
        <WeekendPollView key={params.id} id={params.id} />
      </div>
    </main>
  );
}
