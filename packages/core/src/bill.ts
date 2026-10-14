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

export const billSchema = z.object({
  name: z.string().min(1),
  amountPence: z.number().int().nonnegative(),
  amountIsEstimate: z.boolean(),
  frequency: billFrequencySchema,
  nextDueDate: z.iso.date(),
});

export type Bill = z.infer<typeof billSchema>;
