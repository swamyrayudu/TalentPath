-- Check if current session user exists in database
-- Replace 'YOUR_EMAIL_HERE' with your actual email

-- 1. Check users table
SELECT id, name, email, role, created_at
FROM "user"
WHERE email = 'YOUR_EMAIL_HERE';

-- 2. Check all users (to see what's in the table)
SELECT id, name, email, role, created_at
FROM "user"
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check accounts table (OAuth connections)
SELECT "userId", provider, "providerAccountId"
FROM account
WHERE "userId" IN (
  SELECT id FROM "user" WHERE email = 'YOUR_EMAIL_HERE'
);

-- 4. Check sessions table
SELECT "sessionToken", "userId", expires
FROM session
WHERE "userId" IN (
  SELECT id FROM "user" WHERE email = 'YOUR_EMAIL_HERE'
)
ORDER BY expires DESC
LIMIT 5;

-- 5. Count total users
SELECT COUNT(*) as total_users FROM "user";

-- If your user doesn't exist, you can manually create it:
-- (Uncomment and update with your details)

/*
INSERT INTO "user" (id, name, email, "emailVerified", image, role, created_at)
VALUES (
  '52a7f643-acea-40f5-803d-8e0502cec488', -- Use the ID from your session error
  'Your Name',
  'your.email@example.com',
  NOW(),
  'https://your-image-url.com/photo.jpg',
  'user',
  NOW()
);
*/
