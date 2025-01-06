import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import importPlugin from "eslint-plugin-import";

const airbnbRules = {
  // Airbnb 스타일 가이드의 핵심 규칙들
  "no-var": "error",
  "prefer-const": "error",
  "prefer-template": "error",
  "no-param-reassign": "error",
  "object-shorthand": "error",
  "prefer-destructuring": ["error", { array: true, object: true }],
  "no-array-constructor": "error",
  "func-style": ["error", "expression"],
  "arrow-parens": ["error", "always"],
  "arrow-body-style": ["warn", "as-needed"],
  "no-duplicate-imports": "error",
  "one-var": ["error", "never"],
  "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
  "spaced-comment": ["error", "always"],
  "no-underscore-dangle": "off",
  "max-len": ["warn", { code: 100, ignoreComments: true }],

  // Import 규칙
  "import/prefer-default-export": "off",
  "import/no-default-export": "off",
  "import/extensions": "off",
  "import/no-extraneous-dependencies": "off",
  "import/first": "error",
  "import/newline-after-import": "error",
  "import/no-duplicates": "error",
};

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  js.configs.recommended,
  // 공통 설정
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Airbnb 규칙
      ...airbnbRules,

      // TypeScript
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern:
            "^(js|Injectable|Controller|Get|Post|Put|Delete|Patch|Options|Head|All)$",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      // Prettier
      ...prettierPlugin.configs.recommended.rules,

      // 개발 초기 단계를 위한 규칙 완화
      "no-console": "off",
      "no-unused-vars": "off", // TypeScript rule을 대신 사용
      "no-undef": "off", // TypeScript에서 처리
    },
  },
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/coverage/",
      "**/*.config.js",
      "**/src/**/*.test.js",
      "**/public/*",
      "client/styled-system/",
    ],
  },
  // 설정 파일에 대한 특별 규칙
  {
    files: ["**/eslint.config.js", "**/prettier.config.js", "**/vite.config.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-unused-modules": "off",
    },
  },
];

export default config;
