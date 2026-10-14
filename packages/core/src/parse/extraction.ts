import { z } from "zod";
import { billFrequencySchema } from "../bill.js";

export const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export type Weekday = z.infer<typeof weekdaySchema>;

export const dueSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("day-of-month"),
    day: z.number().int().describe("Day of the month, 1-31"),
  }),
  z.object({
    kind: z.literal("date"),
    date: z.string().describe("ISO date, YYYY-MM-DD"),
  }),
  z.object({
    kind: z.literal("weekday"),
    weekday: weekdaySchema,
  }),
]);

export type Due = z.infer<typeof dueSchema>;

export const billExtractionSchema = z.object({
  isBill: z
    .boolean()
    .describe("False if the text isn't describing a bill or payment"),
  name: z.string().nullable(),
  amountPounds: z.number().nullable(),
  amountIsEstimate: z.boolean(),
  frequency: billFrequencySchema.nullable(),
  due: dueSchema.nullable(),
});

export type BillExtraction = z.infer<typeof billExtractionSchema>;

export type BillExtractor = (input: {
  text: string;
  today: string;
}) => Promise<BillExtraction>;
