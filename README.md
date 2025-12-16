# Kiddos

A family management app that helps parents organize tasks, events, and deadlines for their children by intelligently extracting actionable items from emails and documents.

## Architecture

- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (Vercel Serverless)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **AI**: OpenAI API (GPT-4) for extraction and chat
- **Calendar**: Apple Calendar via CalDAV (iCloud)

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the complete file tree.

## Database Schema

All tables and RLS policies are defined in:
- `supabase/migrations/000001_initial_schema.sql` - Tables
- `supabase/migrations/000002_rls_policies.sql` - RLS policies
- `supabase/migrations/000003_storage_buckets.sql` - Storage configuration

## Core Concepts

### Truth Layers
1. **SourceMessage** - Raw email/paste (immutable)
2. **Document** - Stored attachment/upload (immutable + extracted text)
3. **Suggestion** - AI output (non-canonical, can be rerun)
4. **FamilyItem** - Canonical item (user-trusted)

### AI Extraction
- Input: Email body + documents + user context (kids, activities, timezone)
- Output: Structured suggestions (tasks/events/deadlines) with confidence scores
- See `src/core/ai/prompts/extraction.ts` for the prompt and schema

### Calendar Sync
- **Read sync**: Automatic (caches Apple calendar events)
- **Write sync**: Explicit user intent only (button or chat command)
- Never writes to Apple calendar in background jobs

### Guardrails
- **Risky actions** require confirmation tokens
- All AI actions are logged and undoable
- No silent writes
- Conflict detection for calendar changes

## API Routes

All API contracts and Zod schemas are defined in `src/core/models/api.ts`.

### Ingest
- `POST /api/ingest/outlook/sync` - Sync Outlook emails
- `POST /api/ingest/manual` - Paste email text
- `POST /api/upload` - Upload documents

### Extract
- `POST /api/extract/run` - Run AI extraction on message

### Suggestions
- `GET /api/suggestions/list` - List suggestions
- `POST /api/suggestions/approve` - Approve suggestions → create items
- `POST /api/suggestions/merge` - Merge multiple suggestions

### Items
- `GET /api/items` - List family items
- `POST /api/items` - Create item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

### Calendar
- `POST /api/calendar/apple/connect` - Connect Apple calendar
- `POST /api/calendar/apple/sync-read` - Read sync (cache)
- `POST /api/calendar/apple/write` - Write sync (explicit)
- `POST /api/calendar/apple/import` - Import events → items

### Agent
- `POST /api/agent/chat` - Chat assistant with tool calling

### Actions
- `POST /api/actions/undo` - Undo AI action

## Getting Started

See [IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md) for detailed implementation steps.

### Quick Start

1. **Set up Supabase**
   ```bash
   # Run migrations
   supabase db push
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase and OpenAI keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## Development Phases

1. **Phase 1**: Foundation (Next.js + Supabase auth + basic CRUD)
2. **Phase 2**: Ingest + documents (manual paste, upload, PDF extraction)
3. **Phase 3**: Extraction (OpenAI extraction, suggestions UI, approval)
4. **Phase 4**: Linking + activities
5. **Phase 5**: Apple calendar read cache
6. **Phase 6**: Explicit Apple writes
7. **Phase 7**: Chat agent + guardrails + undo

## Security

- All tables have RLS enabled
- User can only access their own data (`user_id = auth.uid()`)
- Server-only secrets (Apple credentials, OpenAI key)
- All inputs validated with Zod
- File uploads validated (type, size)

## License

Private project - All rights reserved
