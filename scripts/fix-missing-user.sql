-- Fix missing user issue
-- This script creates a user record if it doesn't exist
-- Replace the values with your actual session data from the error message

DO $$
DECLARE
    v_user_id TEXT := '52a7f643-acea-40f5-803d-8e0502cec488'; -- From your error message
    v_email TEXT := 'your.email@example.com'; -- UPDATE THIS with your actual email
    v_name TEXT := 'Your Name'; -- UPDATE THIS with your name
    v_image TEXT := NULL; -- Optional: your profile image URL
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM "user" WHERE id = v_user_id) THEN
        -- Create the missing user
        INSERT INTO "user" (id, name, email, "emailVerified", image, role, created_at)
        VALUES (
            v_user_id,
            v_name,
            v_email,
            NOW(),
            v_image,
            'user',
            NOW()
        );
        
        RAISE NOTICE 'User created successfully: % (%)', v_name, v_email;
    ELSE
        RAISE NOTICE 'User already exists: %', v_user_id;
    END IF;
END $$;

-- Verify the user was created
SELECT id, name, email, role, created_at
FROM "user"
WHERE id = '52a7f643-acea-40f5-803d-8e0502cec488';
