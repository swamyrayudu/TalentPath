-- Manual sync script to populate visible_problems and dsa_topic_stats tables
-- Run this after creating the tables if data isn't showing correctly

-- 1. Sync visible problems from main problems table
SELECT sync_visible_problems();

-- 2. Refresh topic statistics
SELECT refresh_dsa_topic_stats();

-- 3. Verify the sync worked
SELECT 
  'Sync Complete!' as status,
  (SELECT COUNT(*) FROM visible_problems) as visible_problems_count,
  (SELECT COUNT(*) FROM dsa_topic_stats) as topic_stats_count,
  (SELECT SUM(total_count) FROM dsa_topic_stats) as total_problems_in_stats;
