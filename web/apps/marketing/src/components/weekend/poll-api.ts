export type WeekendVote = { outingSlug: string; date: string };

export type WeekendPoll = {
  id: string;
  outings: { slug: string; votes: number }[];
  dates: { date: string; votes: number }[];
  voteCount: number;
  myVote: WeekendVote | null;
};

export async function requestWeekendPoll(path: string, options?: RequestInit): Promise<WeekendPoll> {
  const response = await fetch(`/api/planner/polls${path}`, {
    cache: "no-store",
    ...options,
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.poll) {
    throw new Error(data?.error || "The poll service is unavailable. Please try again.");
  }

  return data.poll;
}
