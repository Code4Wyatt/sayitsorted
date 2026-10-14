import type { BillFrequency } from "@repo/core";

export const frequencyLabels: Record<BillFrequency, string> = {
  "one-off": "Just once",
  weekly: "Every week",
  fortnightly: "Every two weeks",
  "four-weekly": "Every four weeks",
  monthly: "Every month",
  quarterly: "Every three months",
  yearly: "Every year",
};

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatAmount(pence: number, isEstimate: boolean) {
  const amount = money.format(pence / 100).replace(/\.00$/, "");
  return isEstimate ? `about ${amount}` : amount;
}

export function formatDueDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function todayIso() {
  // en-CA formats dates as YYYY-MM-DD.
  return new Date().toLocaleDateString("en-CA");
}
