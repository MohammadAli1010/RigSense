export function formatSegment(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export function formatSpecValue(value: number | string | string[]) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

export function formatRelativeTime(date: Date) {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffInSeconds = (date.getTime() - Date.now()) / 1000;
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  if (Math.abs(diffInDays) > 0) return rtf.format(diffInDays, "day");
  if (Math.abs(diffInHours) > 0) return rtf.format(diffInHours, "hour");
  if (Math.abs(diffInMinutes) > 0) return rtf.format(diffInMinutes, "minute");
  
  return rtf.format(Math.round(diffInSeconds), "second");
}

export function isPriceStale(date: Date) {
  const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() > TWENTY_FOUR_HOURS_IN_MS;
}
