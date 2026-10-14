import { Module, type DynamicModule } from "@nestjs/common";
import { CONFIG, type Config } from "./config.js";

@Module({})
export class ConfigModule {
  static forRoot(config: Config): DynamicModule {
    return {
      global: true,
      module: ConfigModule,
      providers: [{ provide: CONFIG, useValue: config }],
      exports: [CONFIG],
    };
  }
}
