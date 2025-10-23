-- Quick verification script for visible_problems optimization

-- 1. Check if tables exist
SELECT 
  'visible_problems' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'visible_problems'
  ) as exists;

SELECT 
  'dsa_topic_stats' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dsa_topic_stats'
  ) as exists;

-- 2. Check functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('sync_visible_problems', 'refresh_dsa_topic_stats', 'trigger_sync_visible_problems')
ORDER BY routine_name;

-- 3. Check triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'problems'
ORDER BY trigger_name;

-- 4. Count visible problems in main table
SELECT 
  'problems (visible)' as table_name,
  COUNT(*) as count
FROM problems
WHERE is_visible_to_users = true;

-- 5. Count in visible_problems table
SELECT 
  'visible_problems' as table_name,
  COUNT(*) as count
FROM visible_problems;

-- 6. Count in dsa_topic_stats table
SELECT 
  'dsa_topic_stats' as table_name,
  COUNT(*) as count,
  SUM(total_count) as total_problems
FROM dsa_topic_stats;

-- 7. Show sample stats by platform
SELECT 
  platform,
  difficulty,
  COUNT(*) as topic_count,
  SUM(total_count) as total_problems
FROM dsa_topic_stats
GROUP BY platform, difficulty
ORDER BY platform, difficulty;

-- 8. If tables exist but are empty, run sync manually
-- SELECT sync_visible_problems();
-- SELECT refresh_dsa_topic_stats();
