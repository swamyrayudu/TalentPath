-- ================================================
-- QUICK CHECK: Do mock interview tables exist?
-- Run this first in Supabase SQL Editor
-- ================================================

-- Check if tables exist
SELECT 
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mock_interviews') 
    THEN '✓ mock_interviews exists' 
    ELSE '✗ mock_interviews MISSING - Run migration!' 
  END as mock_interviews_status,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interview_questions') 
    THEN '✓ interview_questions exists' 
    ELSE '✗ interview_questions MISSING - Run migration!' 
  END as interview_questions_status,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interview_transcripts') 
    THEN '✓ interview_transcripts exists' 
    ELSE '✗ interview_transcripts MISSING - Run migration!' 
  END as interview_transcripts_status;

-- Check if ENUMs exist
SELECT 
  CASE WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'interview_type') 
    THEN '✓ interview_type enum exists' 
    ELSE '✗ interview_type enum MISSING - Run migration!' 
  END as interview_type_enum,
  CASE WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'interview_status') 
    THEN '✓ interview_status enum exists' 
    ELSE '✗ interview_status enum MISSING - Run migration!' 
  END as interview_status_enum;

-- If you see MISSING above, run the migration below:
-- Copy and paste the entire content of migrations/add_mock_interviews.sql
