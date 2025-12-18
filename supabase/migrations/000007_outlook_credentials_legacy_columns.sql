-- Add legacy encrypted columns if they don't exist, and relax NOT NULL so app can write plain tokens.
ALTER TABLE outlook_credentials
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS expires_at_encrypted TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_type_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE outlook_credentials
  ALTER COLUMN access_token_encrypted DROP NOT NULL,
  ALTER COLUMN refresh_token_encrypted DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;
