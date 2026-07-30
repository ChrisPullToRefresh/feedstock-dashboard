module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "test", "refactor", "ci", "build", "perf"],
    ],
    "header-max-length": [2, "always", 72],
  },
};
