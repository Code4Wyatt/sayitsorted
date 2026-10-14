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

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

const { type, schema } = betaZodOutputFormat(billExtractionSchema);

export class BillExtractionError extends Error {
  override name = "BillExtractionError";
}

export function createClaudeExtractor({
  apiKey,
  client = new Anthropic({ apiKey }),
  model = DEFAULT_BILL_EXTRACTION_MODEL,
}: {
  apiKey?: string;
  client?: Anthropic;
  model?: string;
} = {}): BillExtractor {
  return async ({ text, today }) => {
    const response = await client.beta.messages.create(
      {
        model,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type, schema } },
        system: BILL_EXTRACTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: billExtractionUserMessage(text, today, weekdayOf(today)),
          },
        ],
      },
      { timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES },
    );

    if (response.stop_reason === "refusal") {
      throw new BillExtractionError("The model declined to parse this entry");
    }

    const reply = response.content.find((block) => block.type === "text");
    const result = billExtractionSchema.safeParse(parseJson(reply?.text));
    if (!result.success) {
      throw new BillExtractionError(
        `The model's reply didn't match the schema (stop reason: ${response.stop_reason})`,
        { cause: result.error },
      );
    }
    return result.data;
  };
}

function parseJson(text: string | undefined): unknown {
  try {
    return text === undefined ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}
