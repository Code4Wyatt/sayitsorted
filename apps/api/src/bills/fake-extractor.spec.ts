import { fakeExtractor } from "./fake-extractor.js";

const extract = (text: string) => fakeExtractor({ text, today: "2026-10-15" });

describe("fakeExtractor", () => {
  it("picks out a full bill", async () => {
    expect(await extract("Council tax £140 monthly on the 1st")).toEqual({
      isBill: true,
      name: "Council tax",
      amountPounds: 140,
      amountIsEstimate: false,
      frequency: "monthly",
      due: { kind: "day-of-month", day: 1 },
    });
  });

  it("doesn't mistake the due day for the amount", async () => {
    expect(await extract("rent on the 28th")).toMatchObject({
      name: "rent",
      amountPounds: null,
      due: { kind: "day-of-month", day: 28 },
    });
  });

  it("notices estimates", async () => {
    expect(await extract("electric about 60 a month")).toMatchObject({
      amountPounds: 60,
      amountIsEstimate: true,
      frequency: "monthly",
    });
  });

  it("treats text without any bill details as not a bill", async () => {
    expect((await extract("buy milk")).isBill).toBe(false);
  });
});
