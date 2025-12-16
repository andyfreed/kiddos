-- Simple SQL to create a test user
-- 
-- IMPORTANT: This method requires using Supabase Dashboard first to create the user,
-- then this SQL will ensure the profile exists and user is confirmed.
--
-- OR use the Supabase Dashboard method (recommended):
-- Authentication → Users → Add User → Auto Confirm ✅

-- If user already exists, this will just ensure profile exists
INSERT INTO profiles (user_id, display_name, timezone)
SELECT 
  id,
  'Test User',
  'America/New_York'
FROM auth.users
WHERE email = 'a.freed@outlook.com'
ON CONFLICT (user_id) DO UPDATE
SET display_name = 'Test User';

-- Verify the user exists and is confirmed
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  created_at
FROM auth.users
WHERE email = 'a.freed@outlook.com';
