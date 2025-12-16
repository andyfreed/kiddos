# Kiddos Implementation Steps

## Phase 1: Foundation (Start Here)

### Step 1.1: Initialize Next.js Project
**Files to create:**
- `package.json` - Next.js 14+ with App Router, TypeScript, Tailwind CSS
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.env.local.example` - Environment variables template
- `.gitignore` - Git ignore rules

**Dependencies to install:**
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "zod": "^3.22.4",
    "openai": "^4.20.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^2.0.0",
    "ical.js": "^1.5.0",
    "@microsoft/microsoft-graph-client": "^3.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

### Step 1.2: Set Up Supabase
**Files to create:**
- `src/lib/supabase/client.ts` - Client-side Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/middleware.ts` - Auth middleware

**Actions:**
1. Create Supabase project at supabase.com
2. Run migrations:
   - `000001_initial_schema.sql`
   - `000002_rls_policies.sql`
   - `000003_storage_buckets.sql`
3. Get Supabase URL and anon key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 1.3: Basic Auth Pages
**Files to create:**
- `src/app/(auth)/layout.tsx` - Auth layout
- `src/app/(auth)/sign-in/page.tsx` - Sign in page
- `src/app/(auth)/sign-up/page.tsx` - Sign up page
- `src/app/layout.tsx` - Root layout with auth provider
- `src/app/page.tsx` - Redirect to /today if authenticated, /sign-in if not

**Implementation:**
- Use Supabase Auth UI or custom forms
- Handle email/password authentication
- Redirect authenticated users to app

### Step 1.4: App Layout and Navigation
**Files to create:**
- `src/app/(app)/layout.tsx` - App layout with navigation
- `src/components/shared/NavBar.tsx` - Navigation component
- `src/app/globals.css` - Global styles with Tailwind

**Features:**
- Sidebar or top nav with links to all main pages
- User profile dropdown
- Sign out functionality

### Step 1.5: Core Database Repositories
**Files to create:**
- `src/core/db/client.ts` - Database client wrapper
- `src/core/db/repositories/kids.ts` - Kids CRUD
- `src/core/db/repositories/familyItems.ts` - Family items CRUD

**Implementation:**
- Type-safe database queries using Supabase client
- All queries must respect RLS (user_id filtering)
- Return typed results using Zod schemas

### Step 1.6: Basic Kids Management
**Files to create:**
- `src/app/(app)/kids/page.tsx` - Kids list page
- `src/app/(app)/kids/[kidId]/page.tsx` - Kid detail page
- `src/components/kids/KidList.tsx` - Kids list component
- `src/components/kids/KidForm.tsx` - Add/edit kid form

**API Routes:**
- `src/api/kids/route.ts` - GET (list), POST (create)
- `src/api/kids/[id]/route.ts` - GET (one), PUT (update), DELETE

**Features:**
- List all kids for current user
- Add new kid (name, birthday, grade, notes)
- Edit existing kid
- Delete kid (with confirmation)

### Step 1.7: Basic Family Items CRUD
**Files to create:**
- `src/app/(app)/today/page.tsx` - Today dashboard (placeholder)
- `src/components/items/ItemList.tsx` - Items list component
- `src/components/items/ItemForm.tsx` - Add/edit item form
- `src/components/items/ItemCard.tsx` - Item card component

**API Routes:**
- `src/api/items/route.ts` - GET (list with filters), POST (create)
- `src/api/items/[id]/route.ts` - GET (one), PUT (update), DELETE

**Features:**
- Create manual items (task/event/deadline)
- List items with filters (status, type, kid, date range)
- Update item status (open/done/snoozed/dismissed)
- Delete items (with confirmation)

**Validation:**
- Use Zod schemas from `src/core/models/api.ts`
- Validate all inputs server-side

## Phase 2: Ingest + Documents (Next)

### Step 2.1: Manual Paste Ingest
**Files to create:**
- `src/app/(app)/inbox/page.tsx` - Inbox page
- `src/components/inbox/PasteForm.tsx` - Paste text form
- `src/api/ingest/manual/route.ts` - Manual ingest endpoint

**Implementation:**
- Form to paste email text
- Optional fields: subject, sender name/email, received date
- Creates `source_message` row with provider='manual'
- Shows success message with message ID

### Step 2.2: File Upload
**Files to create:**
- `src/components/inbox/UploadZone.tsx` - Drag-and-drop upload
- `src/api/upload/route.ts` - Upload endpoint
- `src/core/attachments/storage.ts` - Storage helper

**Implementation:**
- Accept PDF, images, text files
- Upload to Supabase Storage in `documents/{user_id}/` folder
- Create `documents` row with storage_path
- Return document ID and signed URL for viewing

### Step 2.3: PDF Text Extraction
**Files to create:**
- `src/core/attachments/pdf.ts` - PDF text extraction
- Update `src/api/upload/route.ts` to extract text

**Implementation:**
- Use a PDF parsing library (e.g., `pdf-parse` or `pdfjs-dist`)
- Extract text content from uploaded PDFs
- Store in `documents.text_content`
- Update `text_extracted_at` timestamp

**Dependencies:**
```json
{
  "pdf-parse": "^1.1.1"
}
```

## Phase 3: Extraction (After Ingest Works)

### Step 3.1: Extraction Runner
**Files to create:**
- `src/core/extraction/builder.ts` - Build extraction input
- `src/core/extraction/runner.ts` - Run OpenAI extraction
- `src/core/ai/client.ts` - OpenAI client wrapper
- `src/api/extract/run/route.ts` - Extraction endpoint

**Implementation:**
1. Load source_message + related documents
2. Load user profile (timezone)
3. Load kids and activities
4. Build prompt using `src/core/ai/prompts/extraction.ts`
5. Call OpenAI with structured output (JSON schema)
6. Validate response with Zod
7. Create `extractions` row
8. Create `suggestions` rows
9. Return suggestions

**OpenAI Configuration:**
- Model: `gpt-4-turbo-preview` or `gpt-4o` (for structured output)
- Temperature: 0.3 (more deterministic)
- Response format: JSON schema matching `EXTRACTION_OUTPUT_SCHEMA`

### Step 3.2: Suggestions UI
**Files to create:**
- `src/app/(app)/suggestions/page.tsx` - Suggestions queue
- `src/components/suggestions/SuggestionQueue.tsx` - Queue component
- `src/components/suggestions/SuggestionCard.tsx` - Individual suggestion
- `src/api/suggestions/list/route.ts` - List suggestions

**Features:**
- Group suggestions by source message
- Show confidence scores
- Show rationale
- Filter by state (new/approved/ignored/merged)
- Filter by kid, date range

### Step 3.3: Approval Flow
**Files to create:**
- `src/components/suggestions/ApprovalForm.tsx` - Approval/edit form
- `src/api/suggestions/approve/route.ts` - Approval endpoint
- `src/core/actions/approve.ts` - Approval logic

**Implementation:**
1. User selects suggestions to approve
2. Optional edits (title, dates, etc.)
3. Optional linking (kids, activities, documents)
4. Create `family_items` rows
5. Create `family_item_links` rows
6. Update suggestions state to 'approved'
7. Log `agent_actions` if triggered by AI

## Phase 4-7: Continue in Order

Follow the same pattern:
1. Create API routes with Zod validation
2. Create core business logic
3. Create UI components
4. Create pages
5. Test end-to-end

## Key Implementation Notes

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Security Checklist
- ✅ All API routes verify authentication
- ✅ All database queries use RLS (user_id filtering)
- ✅ Server-only secrets never exposed to client
- ✅ File uploads validated (type, size)
- ✅ All user inputs validated with Zod
- ✅ Apple credentials encrypted server-side

### Testing Strategy
1. Test each API route independently
2. Test RLS policies (try accessing other user's data)
3. Test validation (invalid inputs)
4. Test error handling
5. Test end-to-end flows

### Deployment Checklist
- [ ] Supabase migrations run on production
- [ ] Environment variables set in Vercel
- [ ] Storage bucket configured
- [ ] RLS policies verified
- [ ] API routes tested
- [ ] Error monitoring set up
