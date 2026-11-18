import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type PlannerPoll = {
  id: string;
  outings: { slug: string; votes: number }[];
  dates: { date: string; votes: number }[];
  voteCount: number;
  myVote: { outingSlug: string; date: string } | null;
};

const VOTER_COOKIE = "tankua_planner_voter";

export function isPlannerDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isPollId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

export function isOutingSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 96 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isVoteCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function decodePlannerPoll(value: unknown): PlannerPoll | null {
  if (typeof value !== "object" || value === null) return null;

  const poll = value as Partial<PlannerPoll>;
  if (typeof poll.id !== "string" || !isPollId(poll.id) || !isVoteCount(poll.voteCount) ||
    !Array.isArray(poll.outings) || !poll.outings.every((outing) => outing && isOutingSlug(outing.slug) && isVoteCount(outing.votes)) ||
    !Array.isArray(poll.dates) || !poll.dates.every((date) => date && isPlannerDate(date.date) && isVoteCount(date.votes)) ||
    (poll.myVote !== null && (!isOutingSlug(poll.myVote?.outingSlug) || !isPlannerDate(poll.myVote?.date)))) {
    return null;
  }
  return poll as PlannerPoll;
}

function signVoterToken(pollId: string, token: string, key: string) {
  return createHmac("sha256", key).update(`tankua-planner-voter:${pollId}:${token}`).digest("base64url");
}

export function readVoterToken(request: NextRequest, pollId: string) {
  const cookie = request.cookies.get(VOTER_COOKIE)?.value;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !cookie || !/^[a-zA-Z0-9_-]{43}\.[a-zA-Z0-9_-]{43}$/.test(cookie)) return null;

  const [token, signature] = cookie.split(".");
  const expected = signVoterToken(pollId, token, key);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? token : null;
}

export function hashVoterToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function readPollRequest(request: NextRequest): Promise<Record<string, unknown> | null> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return null;
  }

  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function isSameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}

export function pollError(error: string, status: number) {
  return NextResponse.json({ error }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function pollResponse(
  poll: PlannerPoll, request: NextRequest, setVoterToken: boolean, status: number, key: string,
) {
  const response = NextResponse.json({ poll }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });

  if (setVoterToken) {
    const token = randomBytes(32).toString("base64url");
    response.cookies.set(VOTER_COOKIE, `${token}.${signVoterToken(poll.id, token, key)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: `/api/planner/polls/${poll.id}`,
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export async function callPlannerPoll(
  name: "create_planner_poll" | "read_planner_poll" | "vote_planner_poll",
  args: Record<string, unknown>,
  request: NextRequest,
  setVoterToken = false,
  status = 200,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return pollError("Trip polls are unavailable right now.", 503);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    if (error.code === "22023") return pollError(error.message, 400);
    if (error.code === "PT409") return pollError(error.message, 409);
    console.error("Planner poll request failed", { operation: name, code: error.code });
    return pollError("Could not load the poll right now. Please try again.", 503);
  }

  if (data === null) return pollError("Poll not found.", 404);
  const poll = decodePlannerPoll(data);
  if (!poll) return pollError("Could not load the poll right now. Please try again.", 503);
  return pollResponse(poll, request, setVoterToken, status, key);
}
