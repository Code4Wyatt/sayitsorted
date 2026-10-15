import { z } from "zod";

export const CONFIG = Symbol("CONFIG");

const envSchema = z
  .object({
    BILL_PARSER: z.enum(["claude", "fake"]).default("claude"),
    ANTHROPIC_API_KEY: z.string().trim().optional(),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
    PORT: z.coerce.number().int().positive().default(3002),
  })
  .transform((env, ctx) => {
    const base = { webOrigin: env.WEB_ORIGIN, port: env.PORT };
    if (env.BILL_PARSER === "fake") {
      return { ...base, billParser: { kind: "fake" as const } };
    }

    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.startsWith("sk-ant-")) {
      ctx.addIssue({
        code: "custom",
        path: ["ANTHROPIC_API_KEY"],
        message: apiKey
          ? "should start with sk-ant-"
          : "is required unless BILL_PARSER=fake",
      });
      return z.NEVER;
    }
    return {
      ...base,
      billParser: { kind: "claude" as const, anthropicApiKey: apiKey },
    };
  });

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
