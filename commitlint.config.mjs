/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Scope is optional, but when given it must name a part of the repo.
    "scope-enum": [
      2,
      "always",
      ["marketing", "web", "api", "mobile", "core", "ui", "config", "deps", "repo"],
    ],
  },
};
