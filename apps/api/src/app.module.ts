import { Module, type DynamicModule } from "@nestjs/common";
import { BillsModule } from "./bills/bills.module.js";
import type { Config } from "./config/config.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { RateLimitModule } from "./rate-limit/rate-limit.module.js";

@Module({
  imports: [RateLimitModule, HealthModule, BillsModule],
})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return { module: AppModule, imports: [ConfigModule.forRoot(config)] };
  }
}
