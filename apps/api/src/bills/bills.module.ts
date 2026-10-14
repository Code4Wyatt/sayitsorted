import { Module } from "@nestjs/common";
import { createClaudeExtractor } from "@repo/core/claude";
import { CONFIG, type Config } from "../config/config.js";
import { BILL_EXTRACTOR } from "./bill-extractor.js";
import { BillsController } from "./bills.controller.js";

@Module({
  controllers: [BillsController],
  providers: [
    {
      provide: BILL_EXTRACTOR,
      inject: [CONFIG],
      useFactory: (config: Config) =>
        createClaudeExtractor({ apiKey: config.anthropicApiKey }),
    },
  ],
})
export class BillsModule {}
