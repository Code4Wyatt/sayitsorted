import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { BillExtractor } from "@repo/core";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../app.module.js";
import { BILL_EXTRACTOR } from "../bills/bill-extractor.js";

describe("rate limiting", () => {
  let app: INestApplication<App>;
  const extract = vi.fn<BillExtractor>().mockResolvedValue({
    isBill: false,
    name: null,
    amountPounds: null,
    amountIsEstimate: false,
    frequency: null,
    due: null,
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule.forRoot({
          anthropicApiKey: "sk-ant-test",
          webOrigin: "http://localhost:3000",
          port: 3002,
        }),
      ],
    })
      .overrideProvider(BILL_EXTRACTOR)
      .useValue(extract)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const parse = () =>
    request(app.getHttpServer())
      .post("/bills/parse")
      .send({ text: "rent", today: "2026-10-14" });

  it("allows 10 parses a minute, then returns 429", async () => {
    for (let i = 0; i < 10; i++) await parse().expect(200);

    const blocked = await parse().expect(429);
    expect(blocked.headers["retry-after-minute"]).toBeDefined();
  });

  it("doesn't limit other routes as tightly", async () => {
    for (let i = 0; i < 11; i++) {
      await request(app.getHttpServer()).get("/").expect(200);
    }
  });
});
