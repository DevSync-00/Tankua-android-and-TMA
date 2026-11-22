type TripSchedule = {
  status: string;
  departure_date: string;
  return_date?: string | null;
  duration_minutes?: number | null;
  revised_end_at?: string | null;
};

export function tripEndTime(trip: TripSchedule) {
  const departure = Date.parse(trip.departure_date);
  const revised = Date.parse(trip.revised_end_at ?? "");
  const returning = Date.parse(trip.return_date ?? "");
  if (Number.isFinite(revised)) return revised;
  if (returning > departure) return returning;
  return departure + (trip.duration_minutes ?? 0) * 60_000;
}

export function canCloseOutTrip(trip: TripSchedule, now = Date.now()) {
  return ["upcoming", "active", "ongoing"].includes(trip.status) && Date.parse(trip.departure_date) <= now;
}

export function needsCloseout(trip: TripSchedule, now = Date.now()) {
  return canCloseOutTrip(trip, now) && tripEndTime(trip) <= now;
}
