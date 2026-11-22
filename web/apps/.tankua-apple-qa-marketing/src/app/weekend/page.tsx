import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import { FieldHero } from "@/components/FieldHero";
import { WeekendPlanner } from "@/components/weekend/WeekendPlanner";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Weekend Planner for Addis Ababa",
  description: "Find day trips and weekend outings from Addis Ababa by time, interests, and entry budget. Get directions and plan with friends.",
  path: "/weekend",
});

export default function WeekendPage() {
  return (
    <main className="field-page">
      <FieldHero
        title="Weekends in Addis Ababa"
        description="Find a half-day outing, a full day out, or an overnight trip. Start with the time you have and what you want to spend."
        image="/images/pexels-fanuel-33019023.jpg"
        imageAlt="A busy avenue in Addis Ababa after rain"
        className="field-hero--weekend"
      >
        <a href="#browse" className="field-button field-button--light">Find an outing<ArrowDown size={17} aria-hidden="true" /></a>
      </FieldHero>
      <nav className="field-wrap field-weekend-tools" aria-label="Weekend tools">
        <Link href="/weekend/this-weekend">
          <CalendarDays size={23} aria-hidden="true" />
          <span><strong>This weekend in Addis</strong><small>Find events and places to go</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </Link>
        <Link href="/weekend/polls/new">
          <UsersRound size={23} aria-hidden="true" />
          <span><strong>Plan with friends</strong><small>Vote on a place and a date</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </Link>
      </nav>
      <WeekendPlanner />
    </main>
  );
}
