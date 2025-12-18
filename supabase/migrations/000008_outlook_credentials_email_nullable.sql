-- Ensure email column exists and is nullable for outlook_credentials
ALTER TABLE outlook_credentials
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE outlook_credentials
  ALTER COLUMN email DROP NOT NULL;
