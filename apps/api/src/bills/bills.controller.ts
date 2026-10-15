import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  UseFilters,
} from "@nestjs/common";
import { days, minutes, Throttle } from "@nestjs/throttler";
import {
  parseBill,
  parseBillRequestSchema,
  type BillExtractor,
  type ParseBillRequest,
  type ParseResult,
} from "@repo/core";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { BILL_EXTRACTOR } from "./bill-extractor.js";
import { ClaudeErrorFilter } from "./claude-error.filter.js";

@Controller("bills")
@UseFilters(ClaudeErrorFilter)
export class BillsController {
  constructor(
    @Inject(BILL_EXTRACTOR) private readonly extract: BillExtractor,
  ) {}

  @Post("parse")
  @HttpCode(200)
  @Throttle({
    minute: { limit: 10, ttl: minutes(1) },
    day: { limit: 100, ttl: days(1) },
  })
  parse(
    @Body(new ZodValidationPipe(parseBillRequestSchema))
    { text, today }: ParseBillRequest,
  ): Promise<ParseResult> {
    return parseBill(text, { extract: this.extract, today });
  }
}
