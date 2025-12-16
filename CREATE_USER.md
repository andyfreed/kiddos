# Creating a Test User in Supabase

Since email verification isn't set up yet, here are the best ways to create a user:

## Method 1: Supabase Dashboard (Easiest & Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Invite User"**
4. Fill in:
   - **Email**: `a.freed@outlook.com`
   - **Password**: `Emmy2016Isla2020!`
   - **Auto Confirm User**: ✅ Check this box (so no email verification needed)
5. Click **"Create User"**

This is the safest and most reliable method.

## Method 2: SQL Script (Alternative)

If you prefer SQL, run this in Supabase SQL Editor:

```sql
-- Create user via Supabase auth functions
-- This requires the auth schema to be accessible

-- Note: Direct password insertion is complex due to encryption
-- The dashboard method above is recommended

-- However, if you have access to Supabase's internal functions:
SELECT auth.create_user('{
  "email": "a.freed@outlook.com",
  "password": "Emmy2016Isla2020!",
  "email_confirm": true
}');
```

## Method 3: Using Supabase Management API

You can also create users programmatically using the Management API, but this requires additional setup.

## After Creating the User

Once the user is created, you can:
1. Sign in at your app with: `a.freed@outlook.com` / `Emmy2016Isla2020!`
2. The user will be automatically confirmed (no email verification needed)
3. A profile entry will be created automatically on first sign-in (if you have a trigger set up)

## Verify User Creation

Run this SQL to check if the user was created:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'a.freed@outlook.com';
```

If `email_confirmed_at` is not null, the user can sign in immediately.
