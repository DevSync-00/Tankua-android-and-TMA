const tripClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Addis_Ababa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getTripDateParts(iso: string): { date: string; time: string } {
  const timestamp = new Date(iso);
  if (Number.isNaN(timestamp.getTime())) return { date: "", time: "" };

  const parts = Object.fromEntries(tripClock.formatToParts(timestamp).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function parseTripTime(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;

  const timestamp = new Date(`${date}T${time}:00+03:00`);
  if (Number.isNaN(timestamp.getTime())) return null;

  const local = getTripDateParts(timestamp.toISOString());
  return local.date === date && local.time === time ? timestamp : null;
}
