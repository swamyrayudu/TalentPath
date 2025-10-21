-- Add is_visible_to_users column to problems table
-- This allows admins to control which problems are shown to regular users

-- Add the column with default value false
ALTER TABLE "problems" 
ADD COLUMN IF NOT EXISTS "is_visible_to_users" BOOLEAN NOT NULL DEFAULT false;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS "problems_is_visible_to_users_idx" ON "problems" ("is_visible_to_users");

-- Optional: Set first 500 problems as visible by default (or adjust as needed)
-- Comment this out if you want all problems to start as hidden
-- UPDATE "problems" SET "is_visible_to_users" = true WHERE "id" <= 500;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'is_visible_to_users column added successfully!';
    RAISE NOTICE 'All problems are now hidden by default (is_visible_to_users = false)';
    RAISE NOTICE 'Admins can now select which problems to show to users';
    RAISE NOTICE 'To make problems visible, update: UPDATE problems SET is_visible_to_users = true WHERE id IN (...)';
END $$;
