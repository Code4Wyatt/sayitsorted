/* global console, process */
import { parseBill } from "../dist/index.js";
import { createClaudeExtractor } from "../dist/claude/index.js";

const text = process.argv.slice(2).join(" ");
if (!text) {
  console.error('Usage: pnpm --filter @repo/core try "<bill entry>"');
  process.exit(1);
}

// en-CA formats dates as YYYY-MM-DD.
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Europe/London",
});
const result = await parseBill(text, {
  extract: createClaudeExtractor(),
  today,
});
console.log(JSON.stringify(result, null, 2));
