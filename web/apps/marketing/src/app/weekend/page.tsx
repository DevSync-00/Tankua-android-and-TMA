import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import { WeekendPlanner } from "@/components/weekend/WeekendPlanner";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Weekend Planner for Addis Ababa",
  description: "Find day trips and weekend outings from Addis Ababa by time, interests, and entry budget. Get directions and plan with friends.",
  path: "/weekend",
});

export default function WeekendPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf5] pb-10 pt-20 text-[#20251d]">
      <section aria-labelledby="weekend-heading" className="relative isolate overflow-hidden bg-[#253529] text-white">
        <Image
          src="/images/pexels-fanuel-33019023.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[center_55%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#141e17]/95 via-[#141e17]/80 to-[#141e17]/30" />
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
          <p className="font-semibold text-[#ffe09a]">Addis Ababa weekend planner</p>
          <h1 id="weekend-heading" className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">What should we do this weekend?</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/90">
            Pick how much time you have and find an outing you can follow on your own or share with friends.
          </p>
          <a href="#browse" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#ffcb54] px-5 font-bold text-[#20251d] hover:bg-[#ffda7e]">
            Browse outings <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <nav aria-label="Weekend tools" className="grid gap-3 sm:grid-cols-2">
        <Link href="/weekend/this-weekend" className="group flex min-h-20 items-center gap-4 rounded-xl border border-[#dfdbce] bg-white px-4 py-3 hover:border-[#ad914a] sm:px-5">
          <CalendarDays className="h-6 w-6 shrink-0 text-[#5a6a53]" aria-hidden="true" />
          <div className="flex-1">
            <span className="block font-bold">This Weekend in Addis</span>
            <span className="mt-1 block text-sm text-[#53574b]">Events and places to go</span>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#655025] transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <Link href="/weekend/polls/new" className="group flex min-h-20 items-center gap-4 rounded-xl border border-[#dfdbce] bg-white px-4 py-3 hover:border-[#ad914a] sm:px-5">
          <UsersRound className="h-6 w-6 shrink-0 text-[#5a6a53]" aria-hidden="true" />
          <div className="flex-1">
            <span className="block font-bold">Plan with friends</span>
            <span className="mt-1 block text-sm text-[#53574b]">Vote on an outing and a date</span>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-[#655025] transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        </nav>
      </div>
      <WeekendPlanner />
    </main>
  );
}
