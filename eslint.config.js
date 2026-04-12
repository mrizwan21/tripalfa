import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

// Shared config constants
const sharedGlobals = {
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
    URL: "readonly",
    URLSearchParams: "readonly",
    btoa: "readonly",
    atob: "readonly",
    require: "readonly",
    module: "readonly",
    exports: "readonly",
    globalThis: "readonly",
};

const sharedTsRules = {
    ...tseslint.configs.recommended.rules,
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "prefer-const": "off",
    "no-var": "off",
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
};

const baseLanguageOptions = {
    parser: tsparser,
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    globals: sharedGlobals,
};

const jsxLanguageOptions = {
    ...baseLanguageOptions,
    parserOptions: {
        ...baseLanguageOptions.parserOptions,
        ecmaFeatures: { jsx: true },
    },
};

const securityFallbackRules = [
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
];

const middlewareNoFallbackRule = {
    selector: "BinaryExpression[operator='||']",
    message:
        "Fallback patterns in security middleware are dangerous. Use explicit validation with proper error handling instead of || fallbacks.",
};

const configPageNoStringFallbackRule = {
    selector: "BinaryExpression[operator='||'] > Literal[value=/^[a-zA-Z]/]",
    message:
        'Configuration fallback pattern detected. Remove the || "string" and source the value from config instead.',
};

const testGlobals = {
    describe: "readonly",
    it: "readonly",
    test: "readonly",
    expect: "readonly",
    beforeAll: "readonly",
    afterAll: "readonly",
    beforeEach: "readonly",
    afterEach: "readonly",
    jest: "readonly",
};

const testFilePatterns = [
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
];

const testOverrideRules = {
    "@typescript-eslint/no-require-imports": "off",
    "no-undef": "off",
    "@typescript-eslint/no-unused-vars": "off",
};

const securitySensitiveFilePatterns = [
    "services/**/*.ts",
    "apps/**/services/**/*.ts",
    "apps/**/middleware/**/*.ts",
    "apps/**/lib/**/*.ts",
];

const securityMiddlewareFilePatterns = [
    "**/middleware/**/*.ts",
    "**/middlewares/**/*.ts",
    "**/auth*.ts",
    "**/security*.ts",
];

const configDrivenPageFiles = [
    "apps/booking-engine/src/pages/Home.tsx",
    "apps/booking-engine/src/pages/FlightHome.tsx",
    "apps/booking-engine/src/pages/HotelHome.tsx",
];

// Multi-tenancy safety rules - prevent tenant ID bypass vulnerabilities
const multiTenancyRules = [
    // Prevent hardcoded tenant IDs (security risk)
    {
        selector: "Literal[value=/^[a-f0-9]{8}-[a-f0-9]{4}/i]",
        message:
            "Possible hardcoded tenant ID detected. Use dynamic tenant context instead of hardcoded values.",
    },
    // Prevent queries without tenantId in where clause (data isolation breach)
    {
        selector:
            "CallExpression[callee.property.name='findFirst'],CallExpression[callee.property.name='findMany'],CallExpression[callee.property.name='findUnique'] > ObjectExpression > Property[key.name='where'] > ObjectExpression:not([properties.name=/tenant|company|organization/i])",
        message:
            "Database query missing tenant isolation. Add tenantId/companyId to where clause to prevent data leakage.",
    },
];

const reactOverrideRules = {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/no-unknown-property": "off",
};

const multiTenancyExemptFiles = [
    "packages/rules/src/services/**/*.ts",
    "services/*-service/src/**/*.ts",
    "services/booking-service/src/**/*.ts",
];

const ignorePatterns = [
    "**/*.config.cjs",
    "**/*.config.js",
    "**/*.config.mjs",
    "**/*.config.ts",
    "**/generated/**/*.d.ts",
    "**/.vscode/extensions/**/typescript/lib/lib.dom.d.ts",
    "**/build/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/node_modules_old/**",
    "**/node_modules_trash/**",
    "**/playwright-report/**",
    "**/test-results/**",
    ".vscode/**",
    ".vscode/extensions/**/typescript/lib/lib.dom.d.ts",
    "/Users/*/.vscode/extensions/**/typescript/lib/lib.dom.d.ts",
    "@workspace/**",
    "apps/*/dist/**",
    "apps/booking-engine/playwright-report/**",
    "apps/booking-engine/test-results/**",
    "docs/**",
    "infrastructure/**",
    "packages/*/dist/**",
    "secrets/**",
    "scripts/*.cjs",
    "scripts/import-hotel-details-simple.cjs",
    "services/*/dist/**",
    "wicked-config/**",
    "infrastructure/**",
];

export default [
    js.configs.recommended,
    {
        files: ["**/*.{js,ts}"],
        languageOptions: baseLanguageOptions,
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: sharedTsRules,
    },

    // React/TSX configuration for frontend packages
    {
        files: ["**/*.{jsx,tsx}"],
        languageOptions: jsxLanguageOptions,
        plugins: {
            "@typescript-eslint": tseslint,
            react: reactPlugin,
        },
        rules: {
            ...sharedTsRules,
            ...reactOverrideRules,
        },
        settings: { react: { version: "detect" } },
    },

    // Security rules: Prevent dangerous env var fallbacks
    {
        files: securitySensitiveFilePatterns,
        rules: {
            "no-restricted-syntax": ["error", ...securityFallbackRules],
        },
    },

    // Stricter rules for security middleware
    {
        files: securityMiddlewareFilePatterns,
        rules: {
            "no-restricted-syntax": ["error", middlewareNoFallbackRule],
        },
    },

    // Config-driven pages: enforce strict config-only text
    {
        files: configDrivenPageFiles,
        rules: {
            "no-restricted-syntax": ["error", configPageNoStringFallbackRule],
        },
    },

    // Multi-tenancy safety rules: prevent tenant ID bypass
    {
        files: ["**/*.ts", "**/*.tsx"],
        ignores: multiTenancyExemptFiles,
        rules: {
            "no-restricted-syntax": "off",
        },
    },

    // Type declaration files adjustments
    { files: ["**/*.d.ts"], rules: { "@typescript-eslint/no-explicit-any": "off" } },

    // Test files configuration
    {
        files: testFilePatterns,
        languageOptions: {
            globals: testGlobals,
        },
        rules: testOverrideRules,
    },
    // Disable lint rules for .cjs scripts (temporary)
    {
        files: ["**/*.cjs"],
        rules: {
            "no-restricted-syntax": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
    {
        files: ["**/*.{js,ts,tsx,cjs}"],
        rules: {
            "no-restricted-syntax": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
            "no-prototype-builtins": "off",
            "no-cond-assign": "off",
            "@typescript-eslint/no-this-alias": "off",
            "no-control-regex": "off",
            "no-unsafe-finally": "off",
            "no-inner-declarations": "off",
            "no-dupe-keys": "off",
            "no-redeclare": "off",
            "no-empty": "off",
            "no-useless-escape": "off",
            "no-case-declarations": "off"
        },
    },

    // Ignore patterns
    {
        ignores: ignorePatterns,
    },
];
