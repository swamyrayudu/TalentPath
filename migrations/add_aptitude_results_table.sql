-- Create aptitude_results table for storing user aptitude test results
-- This table tracks individual aptitude test attempts for each user

-- Drop table if it exists (for clean migration)
DROP TABLE IF EXISTS "aptitude_results";

-- Create the aptitude_results table
CREATE TABLE "aptitude_results" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "time_taken" INTEGER,
    "answers" JSONB,
    "completed_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_aptitude_results_user_id" ON "aptitude_results" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_aptitude_results_topic" ON "aptitude_results" ("topic");
CREATE INDEX IF NOT EXISTS "idx_aptitude_results_completed_at" ON "aptitude_results" ("completed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_aptitude_results_user_topic" ON "aptitude_results" ("user_id", "topic");

-- Add foreign key constraint to Supabase auth.users
-- Note: Supabase uses auth.users for authentication
-- Commenting out foreign key as it may cause issues with text vs uuid types
-- The user_id should match the auth.uid() from Supabase auth
-- Foreign key is optional and enforced through RLS policies instead

-- Grant appropriate permissions (adjust based on your RLS policies)
-- If using Supabase, you might want to enable RLS
ALTER TABLE "aptitude_results" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to read their own results
CREATE POLICY "Users can view own aptitude results"
    ON "aptitude_results"
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Create RLS policy for users to insert their own results
CREATE POLICY "Users can insert own aptitude results"
    ON "aptitude_results"
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Optional: Admin policy (uncomment if you have admin role)
-- CREATE POLICY "Admins can view all aptitude results"
--     ON "aptitude_results"
--     FOR ALL
--     USING (auth.jwt()->>'role' = 'admin');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'aptitude_results table created successfully!';
    RAISE NOTICE 'Table includes: id, user_id, topic, total_questions, correct_answers, score, time_taken, answers, completed_at';
    RAISE NOTICE 'Indexes created for: user_id, topic, completed_at, user_id+topic';
    RAISE NOTICE 'Row Level Security (RLS) enabled with user-specific policies';
END $$;
