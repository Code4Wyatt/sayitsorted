import { describe, expect, it, vi } from "vitest";
import type { BillExtraction, BillExtractor } from "./extraction.js";
import { parseBill } from "./parse-bill.js";

const today = "2026-10-14";

function fakeExtractor(overrides: Partial<BillExtraction>): BillExtractor {
  return async () => ({
    isBill: true,
    name: "Council tax",
    amountPounds: 140,
    amountIsEstimate: false,
    frequency: "monthly",
    due: { kind: "day-of-month", day: 1 },
    ...overrides,
  });
}

describe("parseBill", () => {
  it("returns a complete bill when every detail is given", async () => {
    const result = await parseBill("Council tax, £140, due the 1st, monthly", {
      extract: fakeExtractor({}),
      today,
    });

    expect(result).toEqual({
      status: "complete",
      bill: {
        name: "Council tax",
        amountPence: 14000,
        amountIsEstimate: false,
        frequency: "monthly",
        nextDueDate: "2026-11-01",
      },
    });
  });

  it("converts pounds to whole pence without float errors", async () => {
    const result = await parseBill("Phone £19.99 on the 20th", {
      extract: fakeExtractor({ amountPounds: 19.99 }),
      today,
    });

    expect(result.status === "complete" && result.bill.amountPence).toBe(1999);
  });

  it("keeps estimates marked as estimates", async () => {
    const result = await parseBill("electric, about £80, due the 15th", {
      extract: fakeExtractor({ amountPounds: 80, amountIsEstimate: true }),
      today,
    });

    expect(result.status === "complete" && result.bill.amountIsEstimate).toBe(
      true,
    );
  });

  it("lists what's missing instead of guessing", async () => {
    const result = await parseBill("electric about 80", {
      extract: fakeExtractor({
        name: "Electric",
        amountPounds: 80,
        amountIsEstimate: true,
        frequency: null,
        due: null,
      }),
      today,
    });

    expect(result).toEqual({
      status: "incomplete",
      draft: { name: "Electric", amountPence: 8000, amountIsEstimate: true },
      missing: ["frequency", "nextDueDate"],
    });
  });

  it("treats a blank name or negative amount as missing", async () => {
    const result = await parseBill("something -5", {
      extract: fakeExtractor({ name: "  ", amountPounds: -5 }),
      today,
    });

    expect(result.status === "incomplete" && result.missing).toEqual([
      "name",
      "amount",
    ]);
  });

  it("treats a due date that doesn't exist as missing", async () => {
    const result = await parseBill("rent 30th Feb", {
      extract: fakeExtractor({ due: { kind: "date", date: "2027-02-30" } }),
      today,
    });

    expect(result.status === "incomplete" && result.missing).toEqual([
      "nextDueDate",
    ]);
  });

  it("recognises text that isn't a bill", async () => {
    const result = await parseBill("hello there", {
      extract: fakeExtractor({ isBill: false }),
      today,
    });

    expect(result).toEqual({ status: "not-a-bill" });
  });

  it("doesn't call the model for blank input", async () => {
    const extract = vi.fn(fakeExtractor({}));
    const result = await parseBill("   ", { extract, today });

    expect(result).toEqual({ status: "not-a-bill" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("passes trimmed text and today's date to the extractor", async () => {
    const extract = vi.fn(fakeExtractor({}));
    await parseBill("  rent £900 on the 1st  ", { extract, today });

    expect(extract).toHaveBeenCalledWith({
      text: "rent £900 on the 1st",
      today,
    });
  });

  it("rejects malformed extractor output", async () => {
    const extract = (async () => ({
      isBill: "yes",
    })) as unknown as BillExtractor;

    await expect(parseBill("rent", { extract, today })).rejects.toThrow();
  });
});
