import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      /**
       * Gate >= 80% nos modulos com unit tests solidificados.
       * Alargar este include quando novos specs cobrirem o ficheiro.
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
        "src/core/mail/templates/**/*.ts",
        "src/modules/members/quota.util.ts",
        "src/modules/members/member-gdpr.service.ts",
        "src/modules/members/import/member-import-column-map.ts",
        "src/modules/members/import/member-export-rows.ts",
        "src/modules/members/import/member-import-parse.ts",
        "src/modules/reminders/org-reminder-settings.ts",
        "src/modules/reports/member-quota-report.util.ts",
        "src/modules/communications/whatsapp.util.ts",
        "src/modules/communications/communications.processor.ts",
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
