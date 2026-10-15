import type { BillExtractor, BillFrequency } from "@repo/core";

const frequencies: [RegExp, BillFrequency][] = [
  [/\bfour[- ]?weekly\b|\bevery four weeks\b/, "four-weekly"],
  [/\bfortnightly\b|\bevery two weeks\b/, "fortnightly"],
  [/\bweekly\b|\bevery week\b|\ba week\b/, "weekly"],
  [/\bquarterly\b/, "quarterly"],
  [/\byearly\b|\bannual(ly)?\b|\ba year\b/, "yearly"],
  [/\bmonthly\b|\bevery month\b|\ba month\b/, "monthly"],
  [/\bone[- ]off\b|\bonce\b/, "one-off"],
];

// A rough stand-in for Claude so the app can run without API credits.
export const fakeExtractor: BillExtractor = async ({ text }) => {
  const lower = text.toLowerCase();
  const amount = /£?(\d+(?:\.\d{1,2})?)\b/.exec(lower);
  const day = /\b(\d{1,2})(?:st|nd|rd|th)\b/.exec(lower);
  const frequency = frequencies.find(([pattern]) => pattern.test(lower));
  const name = text.split(/\s+(?:£|\d|on\b|every\b|due\b)/i)[0]?.trim();

  return {
    isBill: Boolean(amount || day || frequency),
    name: name || null,
    amountPounds: amount ? Number(amount[1]) : null,
    amountIsEstimate: /\babout\b|\baround\b|\broughly\b|\bish\b/.test(lower),
    frequency: frequency?.[1] ?? null,
    due: day ? { kind: "day-of-month", day: Number(day[1]) } : null,
  };
};
