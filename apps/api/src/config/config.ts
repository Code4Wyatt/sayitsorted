import { z } from "zod";

export const CONFIG = Symbol("CONFIG");

const envSchema = z
  .object({
    ANTHROPIC_API_KEY: z
      .string({ error: "is required" })
      .trim()
      .startsWith("sk-ant-", "should start with sk-ant-"),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
    PORT: z.coerce.number().int().positive().default(3002),
  })
  .transform((env) => ({
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    webOrigin: env.WEB_ORIGIN,
    port: env.PORT,
  }));

export type Config = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  override name = "ConfigError";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(
      `Invalid environment variables:\n${z.prettifyError(result.error)}\n` +
        "See apps/api/.env.example.",
    );
  }
  return result.data;
}
