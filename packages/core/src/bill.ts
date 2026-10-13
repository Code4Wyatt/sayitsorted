import { z } from "zod";

export const billFrequencySchema = z.enum([
  "one-off",
  "weekly",
  "fortnightly",
  "four-weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export type BillFrequency = z.infer<typeof billFrequencySchema>;

// The shape a one-line or spoken entry is parsed into, e.g.
// "Council tax, £140, due the 1st, every month".
export const billSchema = z.object({
  name: z.string().min(1),
  // Stored in pence to avoid floating-point rounding.
  amountPence: z.number().int().nonnegative(),
  // True for "about £80" style entries.
  amountIsEstimate: z.boolean(),
  frequency: billFrequencySchema,
  // ISO date (YYYY-MM-DD) of the next payment.
  nextDueDate: z.iso.date(),
});

export type Bill = z.infer<typeof billSchema>;
