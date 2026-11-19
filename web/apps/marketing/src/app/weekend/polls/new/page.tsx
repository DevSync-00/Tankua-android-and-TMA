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
    <main className="field-page px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/weekend" className="field-link">
          <ArrowLeft size={17} aria-hidden="true" /> Weekend planner
        </Link>
        <h1 className="field-display field-display--detail mt-5">Plan with friends</h1>
        <p className="mt-3 max-w-xl leading-7 text-[#444b42]">
          Share one link so everyone can vote on where to go and when.
        </p>
        <NewWeekendPoll initialOuting={typeof searchParams.outing === "string" ? searchParams.outing : undefined} />
      </div>
    </main>
  );
}
