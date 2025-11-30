-- Add last_active_at column to track when users were last active (left/closed the website)
-- This helps admins see user activity patterns

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP;

-- Add last_logout_at column to track when users left/closed the website
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "last_logout_at" TIMESTAMP;

-- Create an index for faster queries on last_active_at
CREATE INDEX IF NOT EXISTS idx_user_last_active_at ON "user" ("last_active_at");

-- Create an index for faster queries on last_logout_at
CREATE INDEX IF NOT EXISTS idx_user_last_logout_at ON "user" ("last_logout_at");
