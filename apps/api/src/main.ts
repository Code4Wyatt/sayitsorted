import { NestFactory } from "@nestjs/core";
import { existsSync } from "node:fs";
import { AppModule } from "./app.module.js";

if (existsSync(".env")) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" });
  await app.listen(process.env.PORT ?? 3002);
}
await bootstrap();
