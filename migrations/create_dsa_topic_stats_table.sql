-- Create optimized DSA topic statistics table
-- This table stores pre-calculated counts for each topic/difficulty/platform combination
-- Eliminates need to count from main problems table on every request

CREATE TABLE IF NOT EXISTS dsa_topic_stats (
  id SERIAL PRIMARY KEY,
  topic_slug VARCHAR(100) NOT NULL,
  topic_name VARCHAR(200) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK')),
  total_count INTEGER DEFAULT 0,
  visible_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(topic_slug, difficulty, platform)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_topic_stats_slug ON dsa_topic_stats(topic_slug);
CREATE INDEX IF NOT EXISTS idx_topic_stats_platform ON dsa_topic_stats(platform);
CREATE INDEX IF NOT EXISTS idx_topic_stats_difficulty ON dsa_topic_stats(difficulty);
CREATE INDEX IF NOT EXISTS idx_topic_stats_composite ON dsa_topic_stats(topic_slug, difficulty, platform);

-- Function to refresh topic stats
-- Call this after any INSERT/UPDATE/DELETE on problems table
CREATE OR REPLACE FUNCTION refresh_dsa_topic_stats()
RETURNS void AS $$
BEGIN
  -- Clear existing stats
  TRUNCATE dsa_topic_stats;
  
  -- Rebuild stats from problems table using proper array unnesting
  INSERT INTO dsa_topic_stats (topic_slug, topic_name, difficulty, platform, total_count, visible_count, last_updated)
  WITH unnested_topics AS (
    SELECT 
      topic_data.topic_slug,
      topic_data.topic_name,
      p.difficulty,
      p.platform,
      p.is_visible_to_users,
      p.id as problem_id
    FROM problems p
    CROSS JOIN LATERAL (
      SELECT 
        slug as topic_slug,
        COALESCE(
          name,
          -- Fallback: capitalize the slug if name is missing
          INITCAP(REPLACE(slug, '-', ' '))
        ) as topic_name
      FROM unnest(
        COALESCE(p.topic_slugs, ARRAY[]::text[]),
        COALESCE(p.main_topics, ARRAY[]::text[])
      ) AS t(slug, name)
      WHERE slug IS NOT NULL AND slug != '' -- Filter out null/empty slugs
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
    COUNT(DISTINCT CASE WHEN is_visible_to_users = true THEN problem_id END) as visible_count,
    CURRENT_TIMESTAMP as last_updated
  FROM unnested_topics
  WHERE topic_slug IS NOT NULL -- Extra safety check
  GROUP BY topic_slug, difficulty, platform;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-refresh stats when problems change
CREATE OR REPLACE FUNCTION trigger_refresh_topic_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Call refresh function asynchronously to avoid blocking
  PERFORM refresh_dsa_topic_stats();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on problems table
DROP TRIGGER IF EXISTS after_problem_insert_refresh_stats ON problems;
CREATE TRIGGER after_problem_insert_refresh_stats
  AFTER INSERT ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_topic_stats();

DROP TRIGGER IF EXISTS after_problem_update_refresh_stats ON problems;
CREATE TRIGGER after_problem_update_refresh_stats
  AFTER UPDATE ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_topic_stats();

DROP TRIGGER IF EXISTS after_problem_delete_refresh_stats ON problems;
CREATE TRIGGER after_problem_delete_refresh_stats
  AFTER DELETE ON problems
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_topic_stats();

-- Initial population of stats
SELECT refresh_dsa_topic_stats();

-- Grant permissions (adjust role as needed)
GRANT SELECT ON dsa_topic_stats TO PUBLIC;

COMMENT ON TABLE dsa_topic_stats IS 'Optimized pre-calculated statistics for DSA topics to improve performance';
COMMENT ON FUNCTION refresh_dsa_topic_stats() IS 'Rebuilds all topic statistics from the problems table';
