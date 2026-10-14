import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { BillsModule } from "./bills/bills.module.js";

@Module({
  imports: [BillsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
