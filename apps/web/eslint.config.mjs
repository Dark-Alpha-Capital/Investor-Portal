import { config as reactInternalConfig } from "@repo/eslint-config/react-internal";

const eslintConfig = [
  ...reactInternalConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "out/**",
      "build/**",
      ".output/**",
      "routeTree.gen.ts",
    ],
  },
];

export default eslintConfig;
