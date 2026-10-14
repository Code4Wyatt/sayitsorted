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

const today = "2026-10-14";

function reply(text: string, stop_reason = "end_turn") {
  return { stop_reason, content: [{ type: "text", text }] };
}

function fakeClient(response: object | Error) {
  const create =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  const client = { beta: { messages: { create } } } as unknown as Anthropic;
  return { client, create };
}

describe("createClaudeExtractor", () => {
  it("returns the extracted fields", async () => {
    const { client } = fakeClient(reply(JSON.stringify(extraction)));

    await expect(
      createClaudeExtractor({ client })({ text: "council tax", today }),
    ).resolves.toEqual(extraction);
  });

  it("tells the model today's date and weekday", async () => {
    const { client, create } = fakeClient(reply(JSON.stringify(extraction)));
    await createClaudeExtractor({ client })({ text: "rent", today });

    const content = create.mock.calls[0]![0].messages[0].content as string;
    expect(content).toContain("Today is wednesday 2026-10-14.");
    expect(content).toContain("<entry>\nrent\n</entry>");
  });

  it("throws when the model declines", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", content: [] });

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today }),
    ).rejects.toThrow(BillExtractionError);
  });

  it("throws when the reply was cut off", async () => {
    const { client } = fakeClient(reply('{"isBill": tr', "max_tokens"));

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today }),
    ).rejects.toThrow(/max_tokens/);
  });

  it("throws when the reply doesn't match the schema", async () => {
    const { client } = fakeClient(
      reply(JSON.stringify({ ...extraction, frequency: "annual" })),
    );

    await expect(
      createClaudeExtractor({ client })({ text: "rent", today }),
    ).rejects.toThrow(BillExtractionError);
  });

  it("leaves SDK errors as they are", async () => {
    const apiError = new Anthropic.RateLimitError(
      429,
      undefined,
      "Rate limited",
      new Headers(),
    );
    const configError = new Anthropic.AnthropicError("No API key");

    await expect(
      createClaudeExtractor(fakeClient(apiError))({ text: "rent", today }),
    ).rejects.toBe(apiError);
    await expect(
      createClaudeExtractor(fakeClient(configError))({ text: "rent", today }),
    ).rejects.toBe(configError);
  });
});
