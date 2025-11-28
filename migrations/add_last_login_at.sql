-- Add last_login_at column to user table
-- This tracks when users last logged in

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP;

-- Create an index for faster queries on last_login_at
CREATE INDEX IF NOT EXISTS idx_user_last_login_at ON "user" ("last_login_at");
