import { Logger, Module } from "@nestjs/common";
import { createClaudeExtractor } from "@repo/core/claude";
import { CONFIG, type Config } from "../config/config.js";
import { BILL_EXTRACTOR } from "./bill-extractor.js";
import { BillsController } from "./bills.controller.js";
import { fakeExtractor } from "./fake-extractor.js";

@Module({
  controllers: [BillsController],
  providers: [
    {
      provide: BILL_EXTRACTOR,
      inject: [CONFIG],
      useFactory: ({ billParser }: Config) => {
        if (billParser.kind === "fake") {
          new Logger(BillsModule.name).warn("Using the fake bill parser");
          return fakeExtractor;
        }
        return createClaudeExtractor({ apiKey: billParser.anthropicApiKey });
      },
    },
  ],
})
export class BillsModule {}
