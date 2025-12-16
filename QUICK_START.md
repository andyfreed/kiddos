# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenAI API key (for AI features - can be added later)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to SQL Editor
3. Run the migrations in order:
   - `supabase/migrations/000001_initial_schema.sql`
   - `supabase/migrations/000002_rls_policies.sql`
   - `supabase/migrations/000003_storage_buckets.sql`
4. Go to Settings > API and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (optional for now)
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Your First Account

1. Click "Sign up" on the landing page
2. Enter your email and password (min 6 characters)
3. You'll be redirected to the app

### 6. Test the App

1. **Add a Kid**: Go to "Kids" → "Add Kid"
2. **Create an Item**: Go to "Today" → "Add Item"
3. **View Items**: Check the "Today" dashboard

## What's Working

✅ Authentication (sign up, sign in, sign out)  
✅ Kids management (CRUD)  
✅ Family items management (CRUD)  
✅ Today dashboard with upcoming items  
✅ Navigation between pages  
✅ Row Level Security (RLS) - users can only see their own data  

## What's Coming Next

- Email ingestion (manual paste + Outlook sync)
- Document upload and PDF extraction
- AI extraction from emails/documents
- Suggestions review and approval
- Apple Calendar integration
- AI chat assistant

## Troubleshooting

### "Unauthorized" errors
- Make sure you're signed in
- Check that your Supabase RLS policies are set up correctly

### Database errors
- Verify all migrations ran successfully
- Check Supabase dashboard for any errors

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall

## Next Steps

See [IMPLEMENTATION_STEPS.md](./IMPLEMENTATION_STEPS.md) for Phase 2 and beyond.
