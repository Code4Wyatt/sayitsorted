import { Module } from "@nestjs/common";
import { createClaudeExtractor } from "@repo/core/claude";
import { BILL_EXTRACTOR } from "./bill-extractor.js";
import { BillsController } from "./bills.controller.js";

@Module({
  controllers: [BillsController],
  providers: [
    { provide: BILL_EXTRACTOR, useFactory: () => createClaudeExtractor() },
  ],
})
export class BillsModule {}
