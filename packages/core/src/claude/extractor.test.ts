import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import type { BillExtraction } from "../parse/extraction.js";
import { BillExtractionError, createClaudeExtractor } from "./extractor.js";

const extraction: BillExtraction = {
  isBill: true,
  name: "Council tax",
  amountPounds: 140,
  amountIsEstimate: false,
  frequency: "monthly",
  due: { kind: "day-of-month", day: 1 },
};

function fakeClient(response: object | Error) {
  const parse =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  const client = { beta: { messages: { parse } } } as unknown as Anthropic;
  return { client, parse };
}

describe("createClaudeExtractor", () => {
  it("returns the parsed output", async () => {
    const { client } = fakeClient({
      stop_reason: "end_turn",
      parsed_output: extraction,
    });
    const extract = createClaudeExtractor({ client });

    await expect(
      extract({ text: "council tax 140 on the 1st", today: "2026-10-14" }),
    ).resolves.toEqual(extraction);
  });

  it("tells the model today's date and weekday", async () => {
    const { client, parse } = fakeClient({
      stop_reason: "end_turn",
      parsed_output: extraction,
    });
    await createClaudeExtractor({ client })({
      text: "rent",
      today: "2026-10-14",
    });

    const content = parse.mock.calls[0]![0].messages[0].content as string;
    expect(content).toContain("Today is wednesday 2026-10-14.");
    expect(content).toContain("<entry>\nrent\n</entry>");
  });

  it("throws when the model declines", async () => {
    const { client } = fakeClient({
      stop_reason: "refusal",
      parsed_output: null,
    });

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today: "2026-10-14" }),
    ).rejects.toThrow(BillExtractionError);
  });

  it("throws when the output was cut off", async () => {
    const { client } = fakeClient({
      stop_reason: "max_tokens",
      parsed_output: null,
    });

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today: "2026-10-14" }),
    ).rejects.toThrow(/max_tokens/);
  });

  it("wraps replies that fail schema validation", async () => {
    const { client } = fakeClient(
      new Anthropic.AnthropicError("Failed to parse structured output"),
    );

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today: "2026-10-14" }),
    ).rejects.toThrow(BillExtractionError);
  });

  it("leaves API errors as they are", async () => {
    const apiError = new Anthropic.RateLimitError(
      429,
      undefined,
      "Rate limited",
      new Headers(),
    );
    const { client } = fakeClient(apiError);

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today: "2026-10-14" }),
    ).rejects.toBe(apiError);
  });
});
