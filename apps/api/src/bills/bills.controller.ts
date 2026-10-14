import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Logger,
  Post,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  parseBill,
  parseBillRequestSchema,
  type BillExtractor,
  type ParseResult,
} from "@repo/core";
import {
  APIError,
  BillExtractionError,
  RateLimitError,
} from "@repo/core/claude";
import { BILL_EXTRACTOR } from "./bill-extractor.js";

@Controller("bills")
export class BillsController {
  private readonly logger = new Logger(BillsController.name);

  constructor(
    @Inject(BILL_EXTRACTOR) private readonly extract: BillExtractor,
  ) {}

  @Post("parse")
  @HttpCode(200)
  async parse(@Body() body: unknown): Promise<ParseResult> {
    const request = parseBillRequestSchema.safeParse(body);
    if (!request.success) {
      throw new BadRequestException(request.error.issues);
    }

    const { text, today } = request.data;
    try {
      return await parseBill(text, { extract: this.extract, today });
    } catch (error) {
      if (error instanceof BillExtractionError) {
        this.logger.warn(error.message);
        throw new UnprocessableEntityException(
          "Couldn't understand that entry",
        );
      }
      if (error instanceof RateLimitError) {
        throw new ServiceUnavailableException("Too busy, try again shortly");
      }
      if (error instanceof APIError) {
        this.logger.error(`Claude API error ${error.status}: ${error.message}`);
        throw new BadGatewayException("Bill parsing is unavailable");
      }
      throw error;
    }
  }
}
