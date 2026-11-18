import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewWeekendPoll } from "@/components/weekend/NewWeekendPoll";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Plan an Addis Outing with Friends",
  description: "Make a weekend trip poll and let friends vote on where to go and when to go.",
  path: "/weekend/polls/new",
});

export default function PollCreatorPage({ searchParams }: { searchParams: { outing?: string | string[] } }) {
  return (
    <main className="min-h-screen bg-[#fbfaf5] px-5 pb-16 pt-28 text-[#20251d] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/weekend" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5a48] hover:underline">
          <ArrowLeft size={17} aria-hidden="true" /> Weekend planner
        </Link>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Plan with friends</h1>
        <p className="mt-3 max-w-xl leading-7 text-[#444b42]">
          Share one link so everyone can vote on where to go and when.
        </p>
        <NewWeekendPoll initialOuting={typeof searchParams.outing === "string" ? searchParams.outing : undefined} />
      </div>
    </main>
  );
}
