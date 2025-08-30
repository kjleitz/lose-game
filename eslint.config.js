import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

import js from "@eslint/js";

export default tseslint.config([
  // Ignore generated/build and vendored library code from linting
  globalIgnores([
    "dist",
    "src/lib/**",
    "e2e/**",
    "tests-examples/**",
    // Not part of the app TS project; avoid type-aware parse errors
    "playwright.config.ts",
    "tailwind.config.ts",
    "vitest.config.ts",
    "vite.config.ts",
    "node_modules/**",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Enable stronger, type-aware rules to surface unsafe patterns early
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      // Use the TypeScript Project Service for type-aware linting
      parserOptions: {
        projectService: true,
        allowDefaultProject: true,
      },
    },
    rules: {
      // Allow intentionally unused variables/args when prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Require explicit return types (aligns with components/loop rules)
      "@typescript-eslint/explicit-function-return-type": "error",

      // Never use `any`
      "@typescript-eslint/no-explicit-any": "error",

      // Ban all TS directive comments that hide type issues
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": true,
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
        },
      ],

      // Prefer interfaces over type aliases for object types
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

      // Enforce naming: camelCase for identifiers, PascalCase for types
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        { selector: "enumMember", format: ["PascalCase", "UPPER_CASE"] },
      ],

      // Ban casting (`as` and angle-bracket) and `satisfies`; prefer fixing types
      "no-restricted-syntax": [
        "error",
        {
          // Disallow all `as` assertions EXCEPT `as const` on literals
          selector: "TSAsExpression:not(:has(TSTypeReference > Identifier[name='const']))",
          message: "No casting via 'as' (except 'as const' on literals). Fix types instead.",
        },
        {
          selector: "TSTypeAssertion",
          message: "No casting via angle-bracket assertion. Fix types instead.",
        },
        {
          selector: "TSatisfiesExpression",
          message: "Avoid 'satisfies' unless explicitly approved.",
        },
        {
          selector: "ExportDefaultDeclaration",
          message: "Prefer named exports over default exports.",
        },
      ],

      // Disallow one-letter identifiers (improves readability). Do not check properties.
      // Allow a solitary underscore ("_") as a throwaway name.
      "id-length": [
        "error",
        {
          min: 2,
          properties: "never",
          exceptionPatterns: ["^_$"],
          exceptions: ["i", "j", "k", "x", "y"],
        },
      ],
    },
  },
  {
    // Test files may use casts to create fakes or broken states
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      // Allow short identifiers in tests for brevity
      "id-length": [
        "error",
        {
          min: 1,
          properties: "never",
          exceptionPatterns: ["^_$"],
          exceptions: ["i", "j", "k", "x", "y"],
        },
      ],
      // Allow TS assertions in tests; keep other restrictions
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSatisfiesExpression",
          message: "Avoid 'satisfies' unless explicitly approved.",
        },
        {
          selector: "ExportDefaultDeclaration",
          message: "Prefer named exports over default exports.",
        },
      ],
      // Relax unsafe-any rules in tests to simplify mocking and introspection
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
]);
