-- Create table for VISIBLE problems only (what users see)
-- This table only contains is_visible_to_users = true problems
-- Auto-syncs when admin changes visibility

CREATE TABLE IF NOT EXISTS visible_problems (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK')),
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  acceptance_rate TEXT,
  url TEXT NOT NULL,
  topic_tags TEXT[],
  company_tags TEXT[],
  main_topics TEXT[],
  topic_slugs TEXT[],
  accepted INTEGER DEFAULT 0,
  submissions INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_visible_problems_difficulty ON visible_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_visible_problems_platform ON visible_problems(platform);
CREATE INDEX IF NOT EXISTS idx_visible_problems_topic_slugs ON visible_problems USING GIN(topic_slugs);
CREATE INDEX IF NOT EXISTS idx_visible_problems_slug ON visible_problems(slug);
CREATE INDEX IF NOT EXISTS idx_visible_problems_composite ON visible_problems(platform, difficulty);

-- Create optimized DSA topic statistics table
CREATE TABLE IF NOT EXISTS dsa_topic_stats (
  id SERIAL PRIMARY KEY,
  topic_slug VARCHAR(100) NOT NULL,
  topic_name VARCHAR(200) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK')),
  total_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(topic_slug, difficulty, platform)
);

-- Create indexes for stats table
CREATE INDEX IF NOT EXISTS idx_topic_stats_slug ON dsa_topic_stats(topic_slug);
CREATE INDEX IF NOT EXISTS idx_topic_stats_platform ON dsa_topic_stats(platform);
CREATE INDEX IF NOT EXISTS idx_topic_stats_difficulty ON dsa_topic_stats(difficulty);
CREATE INDEX IF NOT EXISTS idx_topic_stats_composite ON dsa_topic_stats(topic_slug, difficulty, platform);

-- Function to sync visible problems from main problems table
CREATE OR REPLACE FUNCTION sync_visible_problems()
RETURNS void AS $$
BEGIN
  -- Clear visible_problems table
  TRUNCATE visible_problems;
  
  -- Copy only visible problems
  INSERT INTO visible_problems (
    id, title, slug, difficulty, platform, likes, dislikes, 
    acceptance_rate, url, topic_tags, company_tags, main_topics, 
    topic_slugs, accepted, submissions, is_premium, created_at, updated_at
  )
  SELECT 
    id, title, slug, difficulty, platform, likes, dislikes,
    acceptance_rate, url, topic_tags, company_tags, main_topics,
    topic_slugs, accepted, submissions, is_premium, created_at, updated_at
  FROM problems
  WHERE is_visible_to_users = true;
  
  -- Log sync
  RAISE NOTICE 'Synced % visible problems', (SELECT COUNT(*) FROM visible_problems);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh topic stats from visible_problems table
CREATE OR REPLACE FUNCTION refresh_dsa_topic_stats()
RETURNS void AS $$
BEGIN
  -- Clear existing stats
  TRUNCATE dsa_topic_stats;
  
  -- Rebuild stats from visible_problems table only
  INSERT INTO dsa_topic_stats (topic_slug, topic_name, difficulty, platform, total_count, last_updated)
  WITH unnested_topics AS (
    SELECT 
      topic_data.topic_slug,
      topic_data.topic_name,
      p.difficulty,
      p.platform,
      p.id as problem_id
    FROM visible_problems p
    CROSS JOIN LATERAL (
      SELECT 
        slug as topic_slug,
        COALESCE(
          name,
          INITCAP(REPLACE(slug, '-', ' '))
        ) as topic_name
      FROM unnest(
        COALESCE(p.topic_slugs, ARRAY[]::text[]),
        COALESCE(p.main_topics, ARRAY[]::text[])
      ) AS t(slug, name)
      WHERE slug IS NOT NULL AND slug != ''
    ) topic_data
    WHERE p.topic_slugs IS NOT NULL 
      AND array_length(p.topic_slugs, 1) > 0
  )
  SELECT 
    topic_slug,
    MAX(topic_name) as topic_name,
    difficulty,
    platform,
    COUNT(DISTINCT problem_id) as total_count,
    CURRENT_TIMESTAMP as last_updated
  FROM unnested_topics
  WHERE topic_slug IS NOT NULL
  GROUP BY topic_slug, difficulty, platform;
  
  -- Log refresh
  RAISE NOTICE 'Refreshed stats for % topic combinations', (SELECT COUNT(*) FROM dsa_topic_stats);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-sync when problems table changes
CREATE OR REPLACE FUNCTION trigger_sync_visible_problems()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync visible problems
  PERFORM sync_visible_problems();
  -- Refresh stats
  PERFORM refresh_dsa_topic_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on problems table
DROP TRIGGER IF EXISTS after_problem_insert_sync ON problems;
CREATE TRIGGER after_problem_insert_sync
  AFTER INSERT ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_visible_problems();

DROP TRIGGER IF EXISTS after_problem_update_sync ON problems;
CREATE TRIGGER after_problem_update_sync
  AFTER UPDATE ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_visible_problems();

DROP TRIGGER IF EXISTS after_problem_delete_sync ON problems;
CREATE TRIGGER after_problem_delete_sync
  AFTER DELETE ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_visible_problems();

-- Initial sync and stats refresh
SELECT sync_visible_problems();
SELECT refresh_dsa_topic_stats();

-- Grant permissions
GRANT SELECT ON visible_problems TO PUBLIC;
GRANT SELECT ON dsa_topic_stats TO PUBLIC;

COMMENT ON TABLE visible_problems IS 'Mirror of problems table containing only visible questions for users';
COMMENT ON TABLE dsa_topic_stats IS 'Optimized pre-calculated statistics from visible_problems';
COMMENT ON FUNCTION sync_visible_problems() IS 'Syncs visible problems from problems table';
COMMENT ON FUNCTION refresh_dsa_topic_stats() IS 'Rebuilds topic statistics from visible_problems table';
