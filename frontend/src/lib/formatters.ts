const TIMEZONE_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  UTC: "UTC"
};

function getTimeZoneLabel(timeZone: string): string {
  return TIMEZONE_LABELS[timeZone] ?? timeZone;
}

export function formatDateOnly(timestamp: string, timeZone = "Asia/Jakarta"): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

export function formatDateTime(timestamp: string, timeZone = "Asia/Jakarta"): string {
  try {
    const value = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone
    }).format(new Date(timestamp));
    return `${value} ${getTimeZoneLabel(timeZone)}`;
  } catch {
    return timestamp;
  }
}

export function localDateBoundary(date: string, endOfDay = false, timeZone = "Asia/Jakarta"): string {
  const offset = timeZone === "UTC" ? "+00:00" : "+07:00";
  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${date}T${time}${offset}`).toISOString();
}

export function isDateParameter(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}
