# Deployment Guide

## Prerequisites

- GitHub account with repository: https://github.com/andyfreed/kiddos.git
- Vercel account (free tier works)
- Supabase project set up with migrations run
- OpenAI API key (optional for Phase 1-2)

## Step 1: Push to GitHub

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Phase 1 foundation"

# Push to GitHub (if repo is empty, use -u flag)
git push -u origin main
```

If the branch is named `master` instead of `main`:
```bash
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `andyfreed/kiddos`
4. Vercel will auto-detect Next.js settings
5. **Before deploying, configure Environment Variables** (see below)
6. Click "Deploy"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

**CRITICAL**: Set these in Vercel before deploying!

1. In Vercel project settings, go to **Settings → Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development**:

### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL
= your-supabase-project-url
Example: https://xxxxxxxxxxxxx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
= your-supabase-anon-key

SUPABASE_SERVICE_ROLE_KEY
= your-supabase-service-role-key
⚠️ Keep this secret!

NEXT_PUBLIC_APP_URL
= your-vercel-deployment-url
Example: https://kiddos.vercel.app
(You'll get this after first deployment, then update it)
```

### Optional Variables (for later phases)

```
OPENAI_API_KEY
= your-openai-api-key
(Required for Phase 3+)

MICROSOFT_CLIENT_ID
= your-azure-app-client-id
(Required for Phase 2+ Outlook integration)

MICROSOFT_CLIENT_SECRET
= your-azure-app-client-secret
(Required for Phase 2+ Outlook integration)

MICROSOFT_TENANT_ID
= your-azure-tenant-id
(Required for Phase 2+ Outlook integration)

ENCRYPTION_KEY
= your-32-character-hex-string
(Required for Phase 5+ Apple Calendar)
```

## Step 4: Update NEXT_PUBLIC_APP_URL

After your first deployment:

1. Vercel will give you a URL like `https://kiddos-xxxxx.vercel.app`
2. Go to **Settings → Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
4. Redeploy (or it will auto-redeploy on next push)

## Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Test sign up / sign in
3. Verify Supabase connection works
4. Test creating kids and items

## Troubleshooting

### Build Fails

- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` has correct dependencies

### "Unauthorized" Errors

- Check Supabase RLS policies are set up
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check Supabase project is active

### Database Connection Issues

- Verify Supabase project URL is correct
- Check Supabase project is not paused
- Ensure migrations ran successfully

### Environment Variables Not Working

- Variables must be set in Vercel dashboard
- `NEXT_PUBLIC_*` variables are available client-side
- Other variables are server-only
- Redeploy after adding/updating variables

## Continuous Deployment

Once set up, Vercel will automatically deploy:
- Every push to `main` branch → Production
- Every push to other branches → Preview deployment
- Every pull request → Preview deployment

## Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
