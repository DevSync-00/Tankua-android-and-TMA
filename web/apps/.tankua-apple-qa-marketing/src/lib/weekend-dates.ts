const addisDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Addis_Ababa",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getAddisToday(now = new Date()) {
  const parts = addisDate.formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatWeekendDate(date: string, options: Intl.DateTimeFormatOptions = { dateStyle: "full" }) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
