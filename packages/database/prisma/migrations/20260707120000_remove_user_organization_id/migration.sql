-- Migração legacy: só corre se a coluna User.organizationId ainda existir (bases antigas com db:push).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'organizationId'
  ) THEN
    INSERT INTO "OrganizationMember" ("id", "userId", "organizationId", "orgRole", "createdAt", "updatedAt")
    SELECT
      'mig_' || u."id" || '_' || u."organizationId",
      u."id",
      u."organizationId",
      CASE
        WHEN u."role" = 'imperador' THEN 'imperador'
        WHEN u."role" = 'tesoureiro' THEN 'tesoureiro'
        ELSE 'administrador'
      END,
      NOW(),
      NOW()
    FROM "User" u
    WHERE u."organizationId" IS NOT NULL
      AND u."role" IS DISTINCT FROM 'socio'
      AND NOT EXISTS (
        SELECT 1
        FROM "OrganizationMember" om
        WHERE om."userId" = u."id" AND om."organizationId" = u."organizationId"
      );

    ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
    DROP INDEX IF EXISTS "User_organizationId_idx";
    ALTER TABLE "User" DROP COLUMN "organizationId";
  END IF;
END $$;
