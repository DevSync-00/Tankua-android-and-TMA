import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "ETB"): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type TripCurrency = "ETB" | "USD";
export type CurrencyTotals = Partial<Record<TripCurrency, number>>;

export function getTripCurrency(currency: unknown): TripCurrency {
  return currency === "USD" ? "USD" : "ETB";
}

export function sumByCurrency<T extends { currency: unknown }>(items: readonly T[], amount: (item: T) => number): CurrencyTotals {
  const totals: CurrencyTotals = {};
  for (const item of items) {
    const currency = getTripCurrency(item.currency);
    totals[currency] = (totals[currency] ?? 0) + amount(item);
  }
  return totals;
}

export function formatCurrencyTotals(totals: CurrencyTotals): string {
  const values = (['ETB', 'USD'] as const).flatMap((currency) => {
    const amount = totals[currency];
    return amount === undefined ? [] : [formatCurrency(amount, currency)];
  });
  return values.join(" · ") || formatCurrency(0);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options || defaultOptions);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date, { month: "short", day: "numeric" });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

