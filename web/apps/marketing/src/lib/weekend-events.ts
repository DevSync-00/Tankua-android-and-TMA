import { supabase } from "./supabase";
import { getAddisToday } from "./weekend-dates";
import { getAddisWeekend, getWeekendEvents, type WeekendEvent } from "./weekend-plans";

export async function loadWeekendEvents(now: Date): Promise<WeekendEvent[]> {
  const { saturday, sunday } = getAddisWeekend(now);
  const today = getAddisToday(now);
  const firstDate = today > saturday ? today : saturday;
  const { data, error } = await supabase
    .from("weekend_events")
    .select("slug,title,description,start_date,end_date,location,source_label,source_url,map_url")
    .eq("is_published", true)
    .lte("start_date", sunday)
    .or(`end_date.gte.${firstDate},and(end_date.is.null,start_date.gte.${firstDate})`)
    .order("start_date")
    .order("title");

  if (error) {
    if (["42P01", "PGRST205"].includes(error.code)) return getWeekendEvents(now);
    console.error("Weekend events unavailable", error.message);
    return [];
  }

  return data.map((event) => ({
    slug: event.slug,
    title: event.title,
    description: event.description,
    startDate: event.start_date,
    endDate: event.end_date ?? undefined,
    location: event.location,
    source: { label: event.source_label, url: event.source_url },
    mapUrl: event.map_url ?? undefined,
  }));
}
