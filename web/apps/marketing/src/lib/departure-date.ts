const departureDay = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const departureTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Addis_Ababa",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDepartureDate(value: string, includeTime = false) {
  const date = new Date(value);
  const day = departureDay.format(date);
  return includeTime ? `${day} · ${departureTime.format(date)} EAT` : day;
}
