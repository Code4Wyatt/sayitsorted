import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { BillExtraction, BillExtractor } from "@repo/core";
import {
  APIError,
  BillExtractionError,
  RateLimitError,
} from "@repo/core/claude";
import request from "supertest";
import { App } from "supertest/types.js";
import { BILL_EXTRACTOR } from "./bill-extractor.js";
import { BillsModule } from "./bills.module.js";

const extraction: BillExtraction = {
  isBill: true,
  name: "Council tax",
  amountPounds: 140,
  amountIsEstimate: false,
  frequency: "monthly",
  due: { kind: "day-of-month", day: 1 },
};

describe("POST /bills/parse", () => {
  let app: INestApplication<App>;
  const extract = vi.fn<BillExtractor>();

  beforeEach(async () => {
    extract.mockReset().mockResolvedValue(extraction);
    const moduleRef = await Test.createTestingModule({ imports: [BillsModule] })
      .overrideProvider(BILL_EXTRACTOR)
      .useValue(extract)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (body: object) =>
    request(app.getHttpServer()).post("/bills/parse").send(body);

  it("returns the parsed bill", async () => {
    const response = await post({
      text: "council tax 140 on the 1st",
      today: "2026-10-14",
    }).expect(200);

    expect(response.body).toEqual({
      status: "complete",
      bill: {
        name: "Council tax",
        amountPence: 14000,
        amountIsEstimate: false,
        frequency: "monthly",
        nextDueDate: "2026-11-01",
      },
    });
    expect(extract).toHaveBeenCalledWith({
      text: "council tax 140 on the 1st",
      today: "2026-10-14",
    });
  });

  it("rejects a missing or invalid date", async () => {
    await post({ text: "rent" }).expect(400);
    await post({ text: "rent", today: "14/10/2026" }).expect(400);
    expect(extract).not.toHaveBeenCalled();
  });

  it("rejects overly long entries", async () => {
    await post({ text: "a".repeat(501), today: "2026-10-14" }).expect(400);
    expect(extract).not.toHaveBeenCalled();
  });

  it("returns 422 when the reply cannot be understood", async () => {
    extract.mockRejectedValue(new BillExtractionError("bad reply"));
    await post({ text: "rent", today: "2026-10-14" }).expect(422);
  });

  it("returns 503 when Claude is rate limited", async () => {
    extract.mockRejectedValue(
      new RateLimitError(429, undefined, "Rate limited", new Headers()),
    );
    await post({ text: "rent", today: "2026-10-14" }).expect(503);
  });

  it("returns 502 for other Claude API errors", async () => {
    extract.mockRejectedValue(
      new APIError(401, undefined, "Invalid key", new Headers()),
    );
    await post({ text: "rent", today: "2026-10-14" }).expect(502);
  });

  it("returns 500 for unexpected errors", async () => {
    extract.mockRejectedValue(new Error("bug"));
    await post({ text: "rent", today: "2026-10-14" }).expect(500);
  });
});
