import { ConfigError, loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("reads the environment and applies defaults", () => {
    expect(loadConfig({ ANTHROPIC_API_KEY: "sk-ant-test" })).toEqual({
      anthropicApiKey: "sk-ant-test",
      webOrigin: "http://localhost:3000",
      port: 3002,
    });
  });

  it("parses the port as a number", () => {
    expect(
      loadConfig({ ANTHROPIC_API_KEY: "sk-ant-test", PORT: "8080" }).port,
    ).toBe(8080);
  });

  it("fails clearly when the API key is missing or empty", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({ ANTHROPIC_API_KEY: "" })).toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("rejects a placeholder key and trims stray whitespace", () => {
    expect(() => loadConfig({ ANTHROPIC_API_KEY: "your-key-here" })).toThrow(
      /should start with sk-ant-/,
    );
    expect(
      loadConfig({ ANTHROPIC_API_KEY: " sk-ant-test " }).anthropicApiKey,
    ).toBe("sk-ant-test");
  });

  it("rejects a web origin that isn't a URL", () => {
    expect(() =>
      loadConfig({ ANTHROPIC_API_KEY: "sk-ant-test", WEB_ORIGIN: "nope" }),
    ).toThrow(/WEB_ORIGIN/);
  });
});
