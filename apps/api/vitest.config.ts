import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      /**
       * Gate >= 80% nos módulos common já cobertos por unit tests.
       * Controllers/serviços Nest medem-se nos E2E; o include alarga-se com novos specs.
       */
      include: [
        "src/common/effective-role.ts",
        "src/common/host-hostname.ts",
        "src/common/org-context.ts",
        "src/common/organization-context.service.ts",
        "src/common/pagination.ts",
        "src/common/parse-api-date.ts",
        "src/common/public-origin.ts",
        "src/common/qr-signature.ts",
        "src/common/rate-limit.ts",
        "src/common/roles.ts",
        "src/common/guards/**/*.ts",
      ],
      exclude: ["src/**/*.spec.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
