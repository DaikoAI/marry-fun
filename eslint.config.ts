import { posaune0423 } from "@posaune0423/eslint-config";
import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

const config = defineConfig([
  ...posaune0423({ typescript: true, react: true }),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "eslint.config.ts",
      ".moltworker/**",
      ".open-next/**",
      ".wrangler/**",
      ".claude/**",
      "wt-*/**",
      "open-next.config.ts",
    ],
  },
]);

export default config;
