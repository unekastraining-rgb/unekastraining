import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Bundle M — ESLint product-readiness config.
 *
 * React Compiler rules stay at default severity (error).
 * Intentional sync/hydration/canvas patterns use narrow
 * `eslint-disable-next-line` comments at the call site — not a global rule demotion.
 */
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
    "src/generated/**",
    "test-results/**",
    "playwright-report/**",
    "**/._*",
  ]),
]);

export default eslintConfig;
