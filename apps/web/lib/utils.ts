import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Format digits with US grouping while typing (e.g. 100000 → 100,000). */
export function formatIntegerInput(
  value: string | null | undefined,
): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

/** Parse a formatted integer input back to a number. */
export function parseFormattedInteger(
  value: string | null | undefined,
): number | null {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
