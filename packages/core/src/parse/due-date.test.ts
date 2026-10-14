import { describe, expect, it } from "vitest";
import { resolveNextDueDate, weekdayOf } from "./due-date.js";

describe("resolveNextDueDate", () => {
  describe("day-of-month", () => {
    const dayOfMonth = (day: number) => ({
      kind: "day-of-month" as const,
      day,
    });

    it("uses this month when the day hasn't passed", () => {
      expect(resolveNextDueDate(dayOfMonth(20), "2026-10-14")).toBe(
        "2026-10-20",
      );
    });

    it("treats today as due today", () => {
      expect(resolveNextDueDate(dayOfMonth(14), "2026-10-14")).toBe(
        "2026-10-14",
      );
    });

    it("moves to next month when the day has passed", () => {
      expect(resolveNextDueDate(dayOfMonth(1), "2026-10-14")).toBe(
        "2026-11-01",
      );
    });

    it("rolls over into the next year", () => {
      expect(resolveNextDueDate(dayOfMonth(1), "2026-12-14")).toBe(
        "2027-01-01",
      );
    });

    it("clamps to the last day of shorter months", () => {
      expect(resolveNextDueDate(dayOfMonth(31), "2026-11-05")).toBe(
        "2026-11-30",
      );
      expect(resolveNextDueDate(dayOfMonth(31), "2027-02-01")).toBe(
        "2027-02-28",
      );
      expect(resolveNextDueDate(dayOfMonth(30), "2028-02-01")).toBe(
        "2028-02-29",
      );
    });

    it("clamps next month too when this month's day has passed", () => {
      expect(resolveNextDueDate(dayOfMonth(31), "2027-01-31")).toBe(
        "2027-01-31",
      );
      expect(resolveNextDueDate(dayOfMonth(30), "2027-01-31")).toBe(
        "2027-02-28",
      );
    });

    it("rejects days that don't exist", () => {
      expect(resolveNextDueDate(dayOfMonth(0), "2026-10-14")).toBeNull();
      expect(resolveNextDueDate(dayOfMonth(32), "2026-10-14")).toBeNull();
      expect(resolveNextDueDate(dayOfMonth(1.5), "2026-10-14")).toBeNull();
    });
  });

  describe("weekday", () => {
    it("finds the next occurrence", () => {
      // 2026-10-14 is a Wednesday.
      expect(
        resolveNextDueDate(
          { kind: "weekday", weekday: "friday" },
          "2026-10-14",
        ),
      ).toBe("2026-10-16");
      expect(
        resolveNextDueDate(
          { kind: "weekday", weekday: "monday" },
          "2026-10-14",
        ),
      ).toBe("2026-10-19");
    });

    it("treats today as due today", () => {
      expect(
        resolveNextDueDate(
          { kind: "weekday", weekday: "wednesday" },
          "2026-10-14",
        ),
      ).toBe("2026-10-14");
    });
  });

  describe("date", () => {
    it("passes through a valid date, including an overdue one", () => {
      expect(
        resolveNextDueDate({ kind: "date", date: "2026-11-03" }, "2026-10-14"),
      ).toBe("2026-11-03");
      expect(
        resolveNextDueDate({ kind: "date", date: "2026-10-12" }, "2026-10-14"),
      ).toBe("2026-10-12");
    });

    it("rejects dates that don't exist", () => {
      expect(
        resolveNextDueDate({ kind: "date", date: "2026-02-30" }, "2026-10-14"),
      ).toBeNull();
      expect(
        resolveNextDueDate({ kind: "date", date: "next friday" }, "2026-10-14"),
      ).toBeNull();
    });
  });

  it("throws on an invalid today", () => {
    expect(() =>
      resolveNextDueDate({ kind: "day-of-month", day: 1 }, "14/10/2026"),
    ).toThrow(RangeError);
  });
});

describe("weekdayOf", () => {
  it("names the day of the week", () => {
    expect(weekdayOf("2026-10-14")).toBe("wednesday");
    expect(weekdayOf("2026-10-18")).toBe("sunday");
  });
});
