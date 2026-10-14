import { NestFactory } from "@nestjs/core";
import { existsSync } from "node:fs";
import { AppModule } from "./app.module.js";
import { ConfigError, loadConfig, type Config } from "./config/config.js";

if (existsSync(".env")) process.loadEnvFile();

let config: Config;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  console.error(error.message);
  process.exit(1);
}

const app = await NestFactory.create(AppModule.forRoot(config));
app.enableCors({ origin: config.webOrigin });
await app.listen(config.port);
