import type { BillDraft } from "@repo/core";
import { describe, expect, it } from "vitest";
import { applyParse, draftToForm, emptyBillForm, toBill } from "./bill-form";

const councilTax: BillDraft = {
  name: "Council tax",
  amountPence: 14000,
  amountIsEstimate: false,
  frequency: "monthly",
  nextDueDate: "2026-11-01",
};

describe("applyParse", () => {
  it("fills an empty form from the first parse", () => {
    expect(applyParse(emptyBillForm, {}, councilTax)).toEqual(
      draftToForm(councilTax),
    );
  });

  it("fills in fields that were missing", () => {
    const partial = { ...councilTax, nextDueDate: undefined };
    const form = applyParse(emptyBillForm, {}, partial);

    expect(applyParse(form, partial, councilTax).nextDueDate).toBe(
      "2026-11-01",
    );
  });

  it("applies a spoken correction", () => {
    const form = draftToForm(councilTax);
    const corrected = { ...councilTax, frequency: "yearly" as const };

    expect(applyParse(form, councilTax, corrected).frequency).toBe("yearly");
  });

  it("keeps manual edits the latest speech didn't change", () => {
    const form = { ...draftToForm(councilTax), amount: "150" };
    const corrected = { ...councilTax, frequency: "yearly" as const };

    expect(applyParse(form, councilTax, corrected)).toMatchObject({
      amount: "150",
      frequency: "yearly",
    });
  });

  it("applies a change to whether the amount is an estimate", () => {
    const form = draftToForm(councilTax);
    const roughly = { ...councilTax, amountIsEstimate: true };

    expect(applyParse(form, councilTax, roughly).amountIsEstimate).toBe(true);
  });

  it("doesn't clear fields the new parse left out", () => {
    const form = draftToForm(councilTax);

    expect(applyParse(form, councilTax, { name: "Council tax" })).toEqual(form);
  });
});

describe("toBill", () => {
  it("builds a bill from a complete form", () => {
    expect(toBill({ ...draftToForm(councilTax), amount: "£19.99" })).toEqual({
      ...councilTax,
      amountPence: 1999,
    });
  });

  it("returns null when something is missing or invalid", () => {
    expect(toBill({ ...draftToForm(councilTax), nextDueDate: "" })).toBeNull();
    expect(toBill({ ...draftToForm(councilTax), amount: "1,000" })).toBeNull();
    expect(toBill({ ...draftToForm(councilTax), name: "  " })).toBeNull();
  });
});
