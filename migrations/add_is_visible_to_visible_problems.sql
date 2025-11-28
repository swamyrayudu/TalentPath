-- Migration: Fix visible_problems sync function to match actual database schema
-- This ensures the sync function properly copies data from problems to visible_problems

-- Add the is_visible_to_users column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'visible_problems' 
        AND column_name = 'is_visible_to_users'
    ) THEN
        ALTER TABLE visible_problems 
        ADD COLUMN is_visible_to_users BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update the sync_visible_problems function to match actual database schema
-- visible_problems table has: likes (text), dislikes (text), accepted (text), etc.
CREATE OR REPLACE FUNCTION sync_visible_problems()
RETURNS void AS $$
BEGIN
  -- Clear visible_problems table
  DELETE FROM visible_problems;
  
  -- Copy only visible problems with proper type casting
  INSERT INTO visible_problems (
    id, title, slug, is_premium, difficulty, platform, likes, dislikes, 
    acceptance_rate, url, topic_tags, company_tags, main_topics, 
    topic_slugs, accepted, submissions, similar_questions,
    created_at, updated_at, is_visible_to_users
  )
  SELECT 
    id, 
    title, 
    slug, 
    is_premium, 
    difficulty::text, 
    platform::text, 
    likes::text,           -- Cast integer to text
    dislikes::text,        -- Cast integer to text
    acceptance_rate,
    url, 
    to_jsonb(topic_tags),  -- Convert text[] to jsonb
    to_jsonb(company_tags),
    to_jsonb(main_topics),
    to_jsonb(topic_slugs), 
    accepted::text,        -- Cast bigint to text
    submissions,
    similar_questions,
    created_at, 
    updated_at, 
    is_visible_to_users
  FROM problems
  WHERE is_visible_to_users = true;
  
  -- Log sync
  RAISE NOTICE 'Synced % visible problems', (SELECT COUNT(*) FROM visible_problems);
END;
$$ LANGUAGE plpgsql;

-- Refresh the visible_problems table
SELECT sync_visible_problems();

-- Grant permissions
GRANT SELECT ON visible_problems TO PUBLIC;

COMMENT ON FUNCTION sync_visible_problems() IS 'Syncs visible problems from problems table to visible_problems table';
