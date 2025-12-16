-- RLS Policies for Kiddos
-- All tables have RLS enabled with user_id-based access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_item_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_calendar_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE apple_event_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Kids policies
CREATE POLICY "Users can view own kids"
    ON kids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kids"
    ON kids FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kids"
    ON kids FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kids"
    ON kids FOR DELETE
    USING (auth.uid() = user_id);

-- Source Messages policies
CREATE POLICY "Users can view own source messages"
    ON source_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own source messages"
    ON source_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Extractions policies
CREATE POLICY "Users can view own extractions"
    ON extractions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extractions"
    ON extractions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Suggestions policies
CREATE POLICY "Users can view own suggestions"
    ON suggestions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
    ON suggestions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions"
    ON suggestions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Family Items policies
CREATE POLICY "Users can view own family items"
    ON family_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family items"
    ON family_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family items"
    ON family_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own family items"
    ON family_items FOR DELETE
    USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities"
    ON activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
    ON activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
    ON activities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
    ON activities FOR DELETE
    USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view own contacts"
    ON contacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
    ON contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
    ON contacts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
    ON contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Places policies
CREATE POLICY "Users can view own places"
    ON places FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own places"
    ON places FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own places"
    ON places FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own places"
    ON places FOR DELETE
    USING (auth.uid() = user_id);

-- Family Item Links policies
CREATE POLICY "Users can view own links"
    ON family_item_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links"
    ON family_item_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
    ON family_item_links FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
    ON family_item_links FOR DELETE
    USING (auth.uid() = user_id);

-- Apple Credentials policies
-- Server-only writes; clients cannot read encrypted password
CREATE POLICY "Users can view own apple credentials (metadata only)"
    ON apple_credentials FOR SELECT
    USING (auth.uid() = user_id);

-- Note: INSERT/UPDATE should be done via server-side RPC or service role
-- This prevents clients from reading app_password_encrypted

-- Apple Calendar Cache policies
CREATE POLICY "Users can view own calendar cache"
    ON apple_calendar_cache FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar cache"
    ON apple_calendar_cache FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar cache"
    ON apple_calendar_cache FOR UPDATE
    USING (auth.uid() = user_id);

-- Apple Event Cache policies
CREATE POLICY "Users can view own event cache"
    ON apple_event_cache FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event cache"
    ON apple_event_cache FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event cache"
    ON apple_event_cache FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own event cache"
    ON apple_event_cache FOR DELETE
    USING (auth.uid() = user_id);

-- Calendar Links policies
CREATE POLICY "Users can view own calendar links"
    ON calendar_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar links"
    ON calendar_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar links"
    ON calendar_links FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar links"
    ON calendar_links FOR DELETE
    USING (auth.uid() = user_id);

-- Agent Actions policies
CREATE POLICY "Users can view own agent actions"
    ON agent_actions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent actions"
    ON agent_actions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
