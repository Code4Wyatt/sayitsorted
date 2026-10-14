import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import {
  days,
  minutes,
  ThrottlerGuard,
  ThrottlerModule,
} from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: "minute", ttl: minutes(1), limit: 60 },
      { name: "day", ttl: days(1), limit: 1000 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
