-- Kiddos Initial Schema
-- All tables with RLS enabled

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (optional user metadata)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    ai_aggressiveness TEXT DEFAULT 'suggestion-only' CHECK (ai_aggressiveness IN ('suggestion-only', 'proactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kids
CREATE TABLE IF NOT EXISTS kids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    birthday DATE,
    grade TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source Messages (immutable)
CREATE TABLE IF NOT EXISTS source_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('outlook', 'manual')),
    external_id TEXT,
    folder TEXT,
    subject TEXT,
    sender_name TEXT,
    sender_email TEXT,
    received_at TIMESTAMPTZ,
    body_text TEXT NOT NULL,
    body_html TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (immutable)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES source_messages(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    sha256 TEXT,
    text_content TEXT,
    text_extracted_at TIMESTAMPTZ,
    extractor_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extractions (AI extraction runs)
CREATE TABLE IF NOT EXISTS extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_message_id UUID NOT NULL REFERENCES source_messages(id) ON DELETE CASCADE,
    extractor_version TEXT NOT NULL,
    input_snapshot JSONB NOT NULL,
    output_raw JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suggestions (non-canonical AI output)
CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extraction_id UUID NOT NULL REFERENCES extractions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'event', 'deadline')),
    title TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    location_text TEXT,
    urls JSONB,
    checklist JSONB,
    confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    suggested_kid_ids JSONB,
    suggested_activity_name TEXT,
    dedupe_key TEXT,
    state TEXT DEFAULT 'new' CHECK (state IN ('new', 'approved', 'ignored', 'merged')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Items (canonical)
CREATE TABLE IF NOT EXISTS family_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'event', 'deadline')),
    title TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'done', 'snoozed', 'dismissed')),
    snooze_until TIMESTAMPTZ,
    checklist JSONB,
    tags JSONB,
    priority INTEGER CHECK (priority >= 1 AND priority <= 5),
    created_from TEXT NOT NULL CHECK (created_from IN ('approved', 'manual', 'chat', 'imported_calendar')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_place_id UUID,
    default_checklist JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Places
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    map_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Item Links (normalized linking)
CREATE TABLE IF NOT EXISTS family_item_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_item_id UUID NOT NULL REFERENCES family_items(id) ON DELETE CASCADE,
    kid_id UUID REFERENCES kids(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES source_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_item_id, kid_id, activity_id, contact_id, place_id, document_id, source_message_id)
);

-- Apple Credentials (server-only writes)
CREATE TABLE IF NOT EXISTS apple_credentials (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    apple_id TEXT NOT NULL,
    app_password_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apple Calendar Cache
CREATE TABLE IF NOT EXISTS apple_calendar_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_url TEXT NOT NULL,
    name TEXT NOT NULL,
    is_writable BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, calendar_url)
);

-- Apple Event Cache
CREATE TABLE IF NOT EXISTS apple_event_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_url TEXT NOT NULL,
    uid TEXT NOT NULL,
    etag TEXT,
    summary TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, calendar_url, uid)
);

-- Calendar Links (mapping between family_items and Apple events)
CREATE TABLE IF NOT EXISTS calendar_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_item_id UUID NOT NULL REFERENCES family_items(id) ON DELETE CASCADE,
    calendar_url TEXT NOT NULL,
    uid TEXT NOT NULL,
    etag TEXT,
    last_pushed_at TIMESTAMPTZ,
    last_pulled_at TIMESTAMPTZ,
    conflict_state TEXT DEFAULT 'ok' CHECK (conflict_state IN ('ok', 'needs_review')),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_item_id, calendar_url, uid)
);

-- Agent Actions (audit + undo)
CREATE TABLE IF NOT EXISTS agent_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK (actor IN ('ai', 'user')),
    action_type TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    before_json JSONB,
    after_json JSONB,
    diff_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kids_user_id ON kids(user_id);
CREATE INDEX IF NOT EXISTS idx_source_messages_user_id ON source_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_source_messages_received_at ON source_messages(received_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_source_message_id ON documents(source_message_id);
CREATE INDEX IF NOT EXISTS idx_extractions_user_id ON extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_extractions_source_message_id ON extractions(source_message_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_state ON suggestions(state);
CREATE INDEX IF NOT EXISTS idx_suggestions_extraction_id ON suggestions(extraction_id);
CREATE INDEX IF NOT EXISTS idx_family_items_user_id ON family_items(user_id);
CREATE INDEX IF NOT EXISTS idx_family_items_status ON family_items(status);
CREATE INDEX IF NOT EXISTS idx_family_items_deadline_at ON family_items(deadline_at);
CREATE INDEX IF NOT EXISTS idx_family_items_start_at ON family_items(start_at);
CREATE INDEX IF NOT EXISTS idx_family_item_links_family_item_id ON family_item_links(family_item_id);
CREATE INDEX IF NOT EXISTS idx_family_item_links_kid_id ON family_item_links(kid_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_places_user_id ON places(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_calendar_cache_user_id ON apple_calendar_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_event_cache_user_id ON apple_event_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_apple_event_cache_start_at ON apple_event_cache(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_links_family_item_id ON calendar_links(family_item_id);
CREATE INDEX IF NOT EXISTS idx_calendar_links_conflict_state ON calendar_links(conflict_state);
CREATE INDEX IF NOT EXISTS idx_agent_actions_user_id ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_target ON agent_actions(target_table, target_id);
