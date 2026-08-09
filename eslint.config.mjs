import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // This project's build dir (see next.config.ts: OneDrive workaround).
    "node_modules/**",
    // Static assets, not source. Includes the pre-built pdf.js worker, which
    // is a megabyte of vendored minified output.
    "public/**",
  ]),
  {
    rules: {
      // The UI copy is prose with contractions everywhere; apostrophes and
      // quotes in JSX text are intentional. Keep the guard for characters
      // that indicate real mistakes.
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },
]);

export default eslintConfig;
