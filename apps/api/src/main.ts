import { NestFactory } from "@nestjs/core";
import { existsSync } from "node:fs";
import { AppModule } from "./app.module.js";
import { CONFIG, type Config } from "./config/config.js";

if (existsSync(".env")) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<Config>(CONFIG);
  app.enableCors({ origin: config.webOrigin });
  await app.listen(config.port);
}
await bootstrap();
