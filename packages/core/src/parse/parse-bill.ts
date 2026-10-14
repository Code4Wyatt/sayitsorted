import { z } from "zod";
import { billSchema } from "../bill.js";
import { resolveNextDueDate } from "./due-date.js";
import {
  billExtractionSchema,
  type BillExtraction,
  type BillExtractor,
} from "./extraction.js";

export const billFieldSchema = z.enum([
  "name",
  "amount",
  "frequency",
  "nextDueDate",
]);

export type BillField = z.infer<typeof billFieldSchema>;

export const billDraftSchema = billSchema.partial();

export type BillDraft = z.infer<typeof billDraftSchema>;

export const parseResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("complete"), bill: billSchema }),
  z.object({
    status: z.literal("incomplete"),
    draft: billDraftSchema,
    missing: z.array(billFieldSchema).min(1),
  }),
  z.object({ status: z.literal("not-a-bill") }),
]);

export type ParseResult = z.infer<typeof parseResultSchema>;

export const parseBillRequestSchema = z.object({
  text: z.string().max(500),
  today: z.iso.date(),
});

export type ParseBillRequest = z.infer<typeof parseBillRequestSchema>;

export async function parseBill(
  text: string,
  { extract, today }: { extract: BillExtractor; today: string },
): Promise<ParseResult> {
  const trimmed = text.trim();
  if (!trimmed) return { status: "not-a-bill" };

  const extraction = billExtractionSchema.parse(
    await extract({ text: trimmed, today }),
  );
  return toParseResult(extraction, today);
}

export function toParseResult(
  extraction: BillExtraction,
  today: string,
): ParseResult {
  if (!extraction.isBill) return { status: "not-a-bill" };

  const draft: BillDraft = { amountIsEstimate: extraction.amountIsEstimate };
  const missing: BillField[] = [];

  const name = extraction.name?.trim();
  if (name) draft.name = name;
  else missing.push("name");

  const pounds = extraction.amountPounds;
  if (pounds !== null && Number.isFinite(pounds) && pounds >= 0) {
    draft.amountPence = Math.round(pounds * 100);
  } else {
    missing.push("amount");
  }

  if (extraction.frequency) draft.frequency = extraction.frequency;
  else missing.push("frequency");

  const nextDueDate = extraction.due
    ? resolveNextDueDate(extraction.due, today)
    : null;
  if (nextDueDate) draft.nextDueDate = nextDueDate;
  else missing.push("nextDueDate");

  if (missing.length > 0) return { status: "incomplete", draft, missing };
  return { status: "complete", bill: billSchema.parse(draft) };
}
