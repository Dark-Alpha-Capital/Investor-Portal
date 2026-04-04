import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/no-unescaped-entities": "off",
    // React Compiler plugin: valid patterns (prop sync, filter reset) still flag; deps are intentional in useMemo below.
    "react-hooks/preserve-manual-memoization": "off",
    "react-hooks/set-state-in-effect": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    ".output/**",
    "next-env.d.ts",
  ],
}];

export default eslintConfig;
