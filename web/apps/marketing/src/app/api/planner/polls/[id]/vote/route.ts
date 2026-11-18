import { NextRequest } from "next/server";
import {
  callPlannerPoll, hashVoterToken, isOutingSlug, isPlannerDate, isPollId, isSameOrigin, pollError, readPollRequest, readVoterToken,
} from "@/lib/planner-polls-server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isSameOrigin(request)) return pollError("This request must come from Tankua.", 403);
  if (!isPollId(params.id)) return pollError("Poll not found.", 404);

  const token = readVoterToken(request, params.id);
  if (!token) return pollError("Refresh the poll before voting.", 409);

  const body = await readPollRequest(request);
  if (!isOutingSlug(body?.outingSlug) || !isPlannerDate(body?.date)) {
    return pollError("Choose an outing and a date from this poll.", 400);
  }

  return callPlannerPoll("vote_planner_poll", {
    p_poll_id: params.id,
    p_voter_hash: hashVoterToken(token),
    p_outing_slug: body.outingSlug,
    p_date: body.date,
  }, request);
}
