-- Consent fields on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consentLegalVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consentLegalAt" TIMESTAMP(3);

-- Refresh token family + unique hash for atomic rotation / reuse detection
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "familyId" TEXT;

-- Backfill existing rows so NOT NULL constraint can apply
UPDATE "RefreshToken"
SET "familyId" = md5(random()::text || id)
WHERE "familyId" IS NULL;

ALTER TABLE "RefreshToken" ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- Unique token hashes (drop non-unique index first if present, then unique)
DROP INDEX IF EXISTS "RefreshToken_tokenHash_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
