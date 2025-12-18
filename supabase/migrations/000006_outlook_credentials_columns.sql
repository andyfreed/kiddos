-- Align outlook_credentials columns with application code
ALTER TABLE outlook_credentials
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS token_type TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Optional: keep encrypted columns if present; application reads/writes plain columns
