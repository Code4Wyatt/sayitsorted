import { Module, type DynamicModule } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { BillsModule } from "./bills/bills.module.js";
import type { Config } from "./config/config.js";
import { ConfigModule } from "./config/config.module.js";
import { RateLimitModule } from "./rate-limit/rate-limit.module.js";

@Module({
  imports: [RateLimitModule, BillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return { module: AppModule, imports: [ConfigModule.forRoot(config)] };
  }
}
