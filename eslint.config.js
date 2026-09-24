import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      ".astro/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      // Generated local proofs and browser profiles are not project source.
      "tmp/**",
      "Businfo/**",
      "codex-knowledge.local/**",
      "content-staging.local/**",
      "local-instructions.local/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        URL: "readonly",
      },
    },
  },
);
