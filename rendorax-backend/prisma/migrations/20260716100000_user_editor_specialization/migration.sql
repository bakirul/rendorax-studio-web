-- Editor specialization metadata (staffing label only — not an auth role).
-- Existing users remain valid with NULL specialization.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "specialization" TEXT;
