-- Create a test user directly in Supabase
-- This bypasses email verification for development/testing
-- 
-- IMPORTANT: This uses Supabase's auth schema functions
-- Run this in Supabase SQL Editor

-- Method 1: Using Supabase's auth.users table directly
-- Note: Password must be hashed with bcrypt
-- This is complex, so we'll use a simpler approach below

-- Method 2: Create user via Supabase Management API (recommended)
-- But since you want SQL, here's the best SQL approach:

-- First, enable the necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to add a user (this will be called manually)
-- Note: Supabase doesn't expose a simple SQL function for this
-- The recommended way is through the Supabase Dashboard

-- However, we can insert directly into auth.users if we hash the password
-- WARNING: This is for development only!

-- The password hash for "Emmy2016Isla2020!" needs to be generated
-- You can generate it using: https://bcrypt-generator.com/
-- Or use this SQL to generate it (requires pgcrypto):

-- For now, here's the SQL to create the user structure:
-- (You'll need to get the password hash from Supabase Dashboard or generate it)

-- Actually, the BEST approach is to use Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Enter email: a.freed@outlook.com
-- 3. Enter password: Emmy2016Isla2020!
-- 4. Uncheck "Auto Confirm User" if you want to control it
-- 5. Click "Create User"

-- But if you MUST use SQL, here's a workaround using a temporary function:

DO $$
DECLARE
  user_id uuid;
  password_hash text;
BEGIN
  -- Generate password hash (this is a simplified version)
  -- In production, Supabase uses a more complex hashing
  -- For now, we'll create the user record and you can set password via dashboard
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'a.freed@outlook.com',
    crypt('Emmy2016Isla2020!', gen_salt('bf')), -- bcrypt hash
    now(), -- email confirmed immediately
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO user_id;
  
  -- Create identity record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    user_id,
    format('{"sub":"%s","email":"%s"}', user_id::text, 'a.freed@outlook.com')::jsonb,
    'email',
    now(),
    now(),
    now()
  );
  
  -- Create profile entry
  INSERT INTO profiles (user_id, display_name, timezone)
  VALUES (user_id, 'Test User', 'America/New_York')
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'User created with ID: %', user_id;
END $$;
