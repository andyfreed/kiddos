-- Add approved_sender_entries jsonb for storing email + label
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS approved_sender_entries JSONB DEFAULT '[]'::jsonb;

-- Backfill from approved_senders text[] if entries column is empty
UPDATE user_settings
SET approved_sender_entries = (
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('email', email, 'label', '')),
    '[]'::jsonb
  )
  FROM unnest(approved_senders) AS email
)
WHERE (approved_sender_entries IS NULL OR jsonb_array_length(approved_sender_entries) = 0)
  AND approved_senders IS NOT NULL;

-- Keep both columns for now; policies already exist from prior migration
