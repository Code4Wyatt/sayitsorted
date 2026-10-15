import {
  BadGatewayException,
  Catch,
  GatewayTimeoutException,
  HttpException,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import {
  APIConnectionTimeoutError,
  APIError,
  BillExtractionError,
  RateLimitError,
} from "@repo/core/claude";
import type { Response } from "express";

@Catch(BillExtractionError, APIError)
export class ClaudeErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ClaudeErrorFilter.name);

  catch(error: BillExtractionError | APIError, host: ArgumentsHost) {
    const exception = this.toHttpException(error);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(exception.getStatus())
      .json(exception.getResponse());
  }

  private toHttpException(
    error: BillExtractionError | APIError,
  ): HttpException {
    if (error instanceof BillExtractionError) {
      this.logger.warn(error.message);
      return new UnprocessableEntityException("Couldn't understand that entry");
    }
    if (error instanceof RateLimitError) {
      return new ServiceUnavailableException("Too busy, try again shortly");
    }
    if (error instanceof APIConnectionTimeoutError) {
      this.logger.error("Claude API request timed out");
      return new GatewayTimeoutException("Bill parsing took too long");
    }
    this.logger.error(`Claude API error ${error.status}: ${error.message}`);
    return new BadGatewayException("Bill parsing is unavailable");
  }
}
