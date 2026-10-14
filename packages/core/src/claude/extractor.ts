import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { weekdayOf } from "../parse/due-date.js";
import {
  billExtractionSchema,
  type BillExtractor,
} from "../parse/extraction.js";
import {
  BILL_EXTRACTION_SYSTEM_PROMPT,
  billExtractionUserMessage,
} from "./prompt.js";

export const DEFAULT_BILL_EXTRACTION_MODEL = "claude-opus-5-5";

export class BillExtractionError extends Error {
  override name = "BillExtractionError";
}

export function createClaudeExtractor({
  client = new Anthropic(),
  model = DEFAULT_BILL_EXTRACTION_MODEL,
}: { client?: Anthropic; model?: string } = {}): BillExtractor {
  return async ({ text, today }) => {
    let response;
    try {
      response = await client.beta.messages.parse({
        model,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: {
          effort: "low",
          format: betaZodOutputFormat(billExtractionSchema),
        },
        system: BILL_EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: billExtractionUserMessage(text, today, weekdayOf(today)),
          },
        ],
      });
    } catch (error) {
      if (error instanceof Anthropic.APIError) throw error;
      throw new BillExtractionError(
        "The model's reply didn't match the schema",
        {
          cause: error,
        },
      );
    }

    if (response.stop_reason === "refusal") {
      throw new BillExtractionError("The model declined to parse this entry");
    }
    if (!response.parsed_output) {
      throw new BillExtractionError(
        `No parseable output (stop reason: ${response.stop_reason})`,
      );
    }
    return response.parsed_output;
  };
}
