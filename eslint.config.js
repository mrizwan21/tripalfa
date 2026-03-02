import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Node.js globals
        URL: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        atob: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        globalThis: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "off",
      "no-var": "off",
      "react/prop-types": "off",
      "no-undef": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-redeclare": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "no-case-declarations": "off",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Config-driven pages: enforce strict config-only text (no fallback literals)
  {
    files: [
      "apps/booking-engine/src/pages/Home.tsx",
      "apps/booking-engine/src/pages/FlightHome.tsx",
      "apps/booking-engine/src/pages/HotelHome.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "BinaryExpression[operator='||'] > Literal[value=/^[a-zA-Z]/]",
          message:
            'Configuration fallback pattern detected. Remove the || "string" and source the value from config instead. This ensures multi-tenancy and prevents hardcoded UI text.',
        },
      ],
    },
  },
  // Service files: prevent dangerous fallback patterns for security-critical configs
  {
    files: [
      "services/**/*.ts",
      "apps/**/services/**/*.ts",
      "apps/**/middleware/**/*.ts",
      "apps/**/lib/**/*.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Prevent process.env fallbacks that can mask missing config errors
        {
          selector:
            "BinaryExpression[operator='||'][left.object.name='process'][left.property.name='env'] > Literal[value='']",
          message:
            "Environment variable fallback to empty string is dangerous. Use explicit validation and throw an error for required configs instead of || ''.",
        },
        // Prevent JWT_SECRET fallbacks specifically
        {
          selector:
            "BinaryExpression[operator='||'][left.object.name='process'][left.property.name='env'][left.property.key.name=/JWT|SECRET|KEY|API_KEY/i]",
          message:
            "Security-sensitive environment variable detected with fallback. These must use explicit validation and throw if missing.",
        },
        // Prevent general object/array/string fallbacks that mask errors
        {
          selector:
            "BinaryExpression[operator='||'] > ObjectExpression[properties.length=0]",
          message:
            "Fallback to empty object {} masks errors. Validate explicitly or use proper default handling.",
        },
        {
          selector:
            "BinaryExpression[operator='||'] > ArrayExpression[elements.length=0]",
          message:
            "Fallback to empty array [] masks errors. Validate explicitly or use proper default handling.",
        },
      ],
    },
  },
  // Middleware: stricter rules for auth/security files
  {
    files: [
      "**/middleware/**/*.ts",
      "**/middlewares/**/*.ts",
      "**/auth*.ts",
      "**/security*.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "BinaryExpression[operator='||']",
          message:
            "Fallback patterns in security middleware are dangerous. Use explicit validation with proper error handling instead of || fallbacks.",
        },
      ],
    },
  },
  // Type declaration files adjustments
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Disallow JS sources (use TypeScript) - DISABLED
  // {
  //   files: ['**/*.{js,jsx,mjs,cjs}'],
  //   ignores: ['**/tests/**/*.cjs', '**/*.config.*', '**/eslint.config.*'],
  //   rules: {
  //     'no-restricted-syntax': [
  //       'error',
  //       {
  //         selector: 'Program',
  //         message: 'JavaScript source files are disallowed. Use TypeScript (.ts/.tsx) instead.',
  //       },
  //     ],
  //   },
  // },
  // Test files configuration
  {
    files: [
      "**/*.test.{js,ts,tsx}",
      "**/*.spec.{js,ts,tsx}",
      "**/tests/**/*.js",
      "**/tests/**/*.ts",
      "**/tests/**/*.tsx",
      "**/tests/**/*.cjs",
      "**/__tests__/**/*.js",
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
      "**/__tests__/**/*.cjs",
    ],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Infrastructure scripts configuration (CommonJS)
  {
    files: ["scripts/infra/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        btoa: "readonly",
        atob: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "**/node_modules/**",
      "**/node_modules_old/**",
      "node_modules_trash/**",
      "**/node_modules_trash/**",
      "dist/**",
      "**/dist/**",
      "build/**",
      "**/build/**",
      "**/*.config.js",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.config.cjs",
      "coverage/**",
      "**/coverage/**",
      ".vscode/**",
      "docs/**",
      "infrastructure/**",
      "secrets/**",
      "wicked-config/**",
      "@workspace/**",
      "services/*/dist/**",
      "apps/*/dist/**",
      "packages/*/dist/**",
      "**/.vscode/extensions/**/typescript/lib/lib.dom.d.ts",
      ".vscode/extensions/**/typescript/lib/lib.dom.d.ts",
      "/Users/*/.vscode/extensions/**/typescript/lib/lib.dom.d.ts",
      "**/playwright-report/**",
      "**/test-results/**",
      "apps/booking-engine/playwright-report/**",
      "apps/booking-engine/test-results/**",
      // CommonJS scripts - skip linting
      "scripts/*.cjs",
      "scripts/import-hotel-details-simple.cjs",
    ],
  },
];
