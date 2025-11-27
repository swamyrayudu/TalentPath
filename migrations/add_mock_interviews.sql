-- ================================================
-- MOCK INTERVIEW SYSTEM MIGRATION
-- Creates tables for AI-powered mock interviews
-- ================================================

-- Create ENUMs
CREATE TYPE interview_type AS ENUM ('dsa-coding', 'system-design', 'behavioral', 'company-specific');
CREATE TYPE interview_status AS ENUM ('in-progress', 'completed', 'abandoned');

-- Create mock_interviews table
CREATE TABLE IF NOT EXISTS mock_interviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'in-progress' NOT NULL,
  difficulty TEXT,
  company_name TEXT,
  duration INTEGER DEFAULT 0,
  score INTEGER,
  feedback TEXT,
  strengths JSONB,
  improvements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  interview_id TEXT NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  difficulty TEXT,
  topics JSONB,
  expected_answer TEXT,
  user_answer TEXT,
  code TEXT,
  language TEXT,
  score INTEGER,
  time_taken INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  answered_at TIMESTAMPTZ
);

-- Create interview_transcripts table
CREATE TABLE IF NOT EXISTS interview_transcripts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  interview_id TEXT NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES interview_questions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_type ON mock_interviews(type);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_status ON mock_interviews(status);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_created_at ON mock_interviews(created_at);

CREATE INDEX IF NOT EXISTS idx_interview_questions_interview_id ON interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_question_number ON interview_questions(interview_id, question_number);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_interview_id ON interview_transcripts(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_question_id ON interview_transcripts(question_id);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_timestamp ON interview_transcripts(timestamp);

-- Add helpful comments
COMMENT ON TABLE mock_interviews IS 'Stores AI mock interview sessions';
COMMENT ON TABLE interview_questions IS 'Questions asked during mock interviews';
COMMENT ON TABLE interview_transcripts IS 'Full conversation transcript of interviews';

COMMENT ON COLUMN mock_interviews.duration IS 'Interview duration in seconds';
COMMENT ON COLUMN mock_interviews.score IS 'Overall interview score (0-100)';
COMMENT ON COLUMN mock_interviews.strengths IS 'JSON array of candidate strengths';
COMMENT ON COLUMN mock_interviews.improvements IS 'JSON array of areas for improvement';

COMMENT ON COLUMN interview_questions.time_taken IS 'Time taken to answer in seconds';
COMMENT ON COLUMN interview_questions.score IS 'Question score (0-100)';
