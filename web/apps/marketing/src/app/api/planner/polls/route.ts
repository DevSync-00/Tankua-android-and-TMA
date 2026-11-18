import { NextRequest } from "next/server";
import {
  callPlannerPoll, isOutingSlug, isPlannerDate, isSameOrigin, pollError, readPollRequest,
} from "@/lib/planner-polls-server";
import { getAddisToday } from "@/lib/weekend-dates";
import { getWeekendPlan } from "@/lib/weekend-plans";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return pollError("This request must come from Tankua.", 403);

  const body = await readPollRequest(request);
  const outings = body?.outingSlugs;
  const dates = body?.dates;
  const today = getAddisToday();

  if (!Array.isArray(outings) || outings.length < 2 || outings.length > 3 ||
    new Set(outings).size !== outings.length || !outings.every((slug) => isOutingSlug(slug) && getWeekendPlan(slug))) {
    return pollError("Choose two or three different outings.", 400);
  }

  if (!Array.isArray(dates) || dates.length < 2 || dates.length > 3 ||
    new Set(dates).size !== dates.length || !dates.every((date) => isPlannerDate(date) && date >= today)) {
    return pollError("Choose two or three different dates from today onward.", 400);
  }

  return callPlannerPoll("create_planner_poll", {
    p_outing_slugs: outings,
    p_dates: dates,
  }, request, true, 201);
}
