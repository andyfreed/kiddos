-- Outlook credentials + user settings for approved senders

-- User Settings (approved senders for Outlook ingest)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    approved_senders TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can read own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Outlook OAuth tokens (per user)
CREATE TABLE IF NOT EXISTS outlook_credentials (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at TIMESTAMPTZ,
    token_type TEXT,
    scope TEXT,
    tenant_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outlook_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can read own outlook credentials" ON outlook_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can insert own outlook credentials" ON outlook_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own outlook credentials" ON outlook_credentials
    FOR UPDATE USING (auth.uid() = user_id);
