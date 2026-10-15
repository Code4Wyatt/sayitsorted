import { parseResultSchema, type ParseResult } from "@repo/core";
import { todayIso } from "./format";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// The API itself gives up after two 20-second attempts at Claude.
const REQUEST_TIMEOUT_MS = 45_000;

const TOO_SLOW = "That took too long. Try again in a moment.";

export class ParseRequestError extends Error {}

export async function requestParse(text: string): Promise<ParseResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/bills/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, today: todayIso() }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ParseRequestError(TOO_SLOW);
    }
    throw new ParseRequestError(
      "Couldn't reach Saysorted. Check your connection.",
    );
  }

  if (response.status === 429) {
    throw new ParseRequestError(
      "You've added a lot in a short time. Wait a minute and try again.",
    );
  }
  if (response.status === 504) {
    throw new ParseRequestError(TOO_SLOW);
  }
  if (response.status === 422) {
    throw new ParseRequestError(
      "Sorry, I didn't catch that. Try saying it another way.",
    );
  }
  if (!response.ok) {
    throw new ParseRequestError("Something went wrong. Try again in a moment.");
  }

  const result = parseResultSchema.safeParse(await response.json());
  if (!result.success) {
    throw new ParseRequestError("Something went wrong. Try again in a moment.");
  }
  return result.data;
}
