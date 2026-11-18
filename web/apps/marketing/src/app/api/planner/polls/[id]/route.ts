import { NextRequest } from "next/server";
import { callPlannerPoll, hashVoterToken, isPollId, pollError, readVoterToken } from "@/lib/planner-polls-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isPollId(params.id)) return pollError("Poll not found.", 404);

  const token = readVoterToken(request, params.id);
  return callPlannerPoll("read_planner_poll", {
    p_poll_id: params.id,
    p_voter_hash: token ? hashVoterToken(token) : null,
  }, request, !token);
}
