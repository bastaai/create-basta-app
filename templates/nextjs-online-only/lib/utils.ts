import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Translates item status codes to user-friendly labels
 */
export function translateItemStatus(status: string | undefined | null): string {
  if (!status) return "Unknown";

  const statusMap: Record<string, string> = {
    ITEM_NOT_OPEN: "Bidding Not Available",
    ITEM_OPEN: "Open for Bidding",
    ITEM_CLOSED: "Closed",
    ITEM_SOLD: "Sold",
    ITEM_WITHDRAWN: "Withdrawn",
    ITEM_PASSED: "Passed",
  };

  return (
    statusMap[status] ||
    status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}
