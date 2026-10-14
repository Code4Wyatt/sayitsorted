import { z } from "zod";
import type { Due, Weekday } from "./extraction.js";

const WEEKDAYS: readonly Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Returns null for impossible dates like 2026-02-30, which `Date` would
// otherwise silently roll over into March.
function toUtc(isoDate: string): Date | null {
  if (!z.iso.date().safeParse(isoDate).success) return null;
  return new Date(isoDate);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function clampedDate(year: number, monthIndex: number, day: number): Date {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const lastDay = daysInMonth(first.getUTCFullYear(), first.getUTCMonth());
  return new Date(
    Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth(),
      Math.min(day, lastDay),
    ),
  );
}

export function weekdayOf(isoDate: string): Weekday {
  const date = toUtc(isoDate);
  if (!date) throw new RangeError(`Invalid ISO date: ${isoDate}`);
  return WEEKDAYS[date.getUTCDay()]!;
}

export function resolveNextDueDate(due: Due, today: string): string | null {
  const now = toUtc(today);
  if (!now) throw new RangeError(`Invalid ISO date for today: ${today}`);

  switch (due.kind) {
    case "date":
      return toUtc(due.date) ? due.date : null;

    case "day-of-month": {
      if (!Number.isInteger(due.day) || due.day < 1 || due.day > 31)
        return null;
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const thisMonth = clampedDate(year, month, due.day);
      return toIso(
        thisMonth >= now ? thisMonth : clampedDate(year, month + 1, due.day),
      );
    }

    case "weekday": {
      const target = WEEKDAYS.indexOf(due.weekday);
      const daysAhead = (target - now.getUTCDay() + 7) % 7;
      return toIso(new Date(now.getTime() + daysAhead * 86_400_000));
    }
  }
}
