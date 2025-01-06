import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import rootConfig from "../eslint.config.js";
import panda from "@pandacss/eslint-plugin";
import pandabox from "@pandabox/prettier-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...rootConfig,

  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["styled-system"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "@pandacss": panda,
      "@pandabox": pandabox,
    },
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, "./tsconfig.json"),
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        document: true,
        window: true,
        navigator: true,
      },
    },
    rules: {
      // Airbnb React 규칙
      "react/boolean-prop-naming": ["error", { rule: "^(is|has)[A-Z]([A-Za-z0-9]?)+" }],
      "react/function-component-definition": [
        "warn",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-closing-bracket-location": ["error", "line-aligned"],
      "react/jsx-closing-tag-location": "error",
      "react/jsx-curly-spacing": ["error", { when: "never", children: true }],
      "react/jsx-equals-spacing": ["error", "never"],
      "react/jsx-first-prop-new-line": ["error", "multiline"],
      "react/jsx-handler-names": "warn",
      "react/jsx-indent": ["error", 2],
      "react/jsx-key": "error",
      "react/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
      "react/jsx-no-bind": "off",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-pascal-case": "error",

      // 개발 초기를 위한 규칙 완화
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "off",
      "react/require-default-props": "off",
      "react/prop-types": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // JSX A11y - 개발 초기에는 경고로만
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",

      // import 순서
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          alphabetize: {
            order: "asc",
          },
        },
      ],

      ...panda.configs.recommended.rules,
      "@pandacss/no-config-function-in-source": "off",
      "@pandacss/prefer-longhand-properties": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
      react: {
        version: "detect",
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
      "import/internal-regex": "^@/",
    },
  },
];
