import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { BillsModule } from "./bills/bills.module.js";
import { ConfigModule } from "./config/config.module.js";

@Module({
  imports: [ConfigModule, BillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
