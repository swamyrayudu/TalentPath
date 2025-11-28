-- Migration to create user_progress table for tracking DSA problem progress
-- Run this in your database (Supabase SQL Editor, pgAdmin, etc.)

-- Create user_progress table (if not exists)
CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    problem_id BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'attempted',
    code TEXT,
    language TEXT,
    solved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_problem_id_idx ON user_progress(problem_id);
CREATE INDEX IF NOT EXISTS user_progress_user_problem_idx ON user_progress(user_id, problem_id);
CREATE INDEX IF NOT EXISTS user_progress_status_idx ON user_progress(status);

-- IMPORTANT: Add unique constraint for upsert (ON CONFLICT) to work
-- Drop if exists first, then recreate
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_progress_user_problem_unique'
    ) THEN
        ALTER TABLE user_progress ADD CONSTRAINT user_progress_user_problem_unique UNIQUE (user_id, problem_id);
    END IF;
EXCEPTION WHEN others THEN
    -- Constraint might already exist, ignore error
    NULL;
END $$;

-- Drop any foreign key constraint on problem_id (if it exists from old schema)
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_problem_id_fkey;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_problem_id_problems_id_fk;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;
