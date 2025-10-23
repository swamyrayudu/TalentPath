-- ============================================
-- TALENTPATH DATABASE CLONE SCRIPT
-- Creates a complete copy of the database
-- ============================================

-- ============================================
-- STEP 1: CREATE NEW DATABASE
-- ============================================

-- Run this command first from your PostgreSQL client:
-- CREATE DATABASE talentpath_clone;

-- ============================================
-- STEP 2: CLONE ALL ENUMS
-- ============================================

-- Connect to the new database, then run:

CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE location_type AS ENUM ('remote', 'onsite', 'hybrid');
CREATE TYPE difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE platform AS ENUM ('LEETCODE', 'CODEFORCES', 'HACKERRANK', 'GEEKSFORGEEKS');
CREATE TYPE progress_status AS ENUM ('solved', 'attempted', 'bookmarked');
CREATE TYPE roadmap_category AS ENUM ('frontend', 'backend', 'fullstack', 'devops', 'mobile', 'data-science', 'ai-ml', 'cybersecurity', 'other');
CREATE TYPE contest_status AS ENUM ('draft', 'upcoming', 'live', 'ended');
CREATE TYPE contest_visibility AS ENUM ('public', 'private');
CREATE TYPE submission_verdict AS ENUM ('pending', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'compilation_error');

-- ============================================
-- STEP 3: CLONE ALL TABLE STRUCTURES
-- ============================================

-- Auth & User Tables
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" TIMESTAMP,
  image TEXT,
  role role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE account (
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  PRIMARY KEY (provider, "providerAccountId")
);

CREATE TABLE session (
  "sessionToken" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE "verificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Jobs System
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  location_type location_type NOT NULL,
  job_type job_type NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  salary TEXT,
  apply_url TEXT NOT NULL,
  company_logo TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Problems & Practice
CREATE TABLE problems (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  difficulty difficulty NOT NULL,
  platform platform DEFAULT 'LEETCODE' NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  dislikes INTEGER DEFAULT 0 NOT NULL,
  acceptance_rate DECIMAL(5, 2) DEFAULT 0,
  url TEXT,
  topic_tags TEXT[] DEFAULT '{}' NOT NULL,
  company_tags TEXT[] DEFAULT '{}' NOT NULL,
  main_topics TEXT[] DEFAULT '{}' NOT NULL,
  topic_slugs TEXT[] DEFAULT '{}' NOT NULL,
  accepted BIGINT DEFAULT 0,
  submissions BIGINT DEFAULT 0,
  similar_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status progress_status NOT NULL,
  code TEXT,
  language TEXT,
  solved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, problem_id)
);

CREATE TABLE companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE topics (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Roadmaps System
CREATE TABLE roadmaps (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category roadmap_category NOT NULL,
  difficulty TEXT NOT NULL,
  estimated_time TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE roadmap_steps (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resources TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE user_roadmap_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  completed_steps TEXT DEFAULT '[]' NOT NULL,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, roadmap_id)
);

-- Contest System
CREATE TABLE contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status contest_status DEFAULT 'draft' NOT NULL,
  visibility contest_visibility DEFAULT 'public' NOT NULL,
  access_code TEXT,
  created_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE contest_questions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty difficulty NOT NULL,
  points INTEGER DEFAULT 100 NOT NULL,
  order_index INTEGER NOT NULL,
  time_limit_seconds INTEGER DEFAULT 2,
  memory_limit_mb INTEGER DEFAULT 256,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE contest_test_cases (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES contest_questions(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT false NOT NULL,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  points INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE contest_participants (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(contest_id, user_id)
);

CREATE TABLE contest_submissions (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES contest_questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  verdict submission_verdict DEFAULT 'pending' NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  passed_test_cases INTEGER DEFAULT 0 NOT NULL,
  total_test_cases INTEGER DEFAULT 0 NOT NULL,
  execution_time_ms INTEGER,
  memory_used_kb INTEGER,
  error_message TEXT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE contest_leaderboard (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0 NOT NULL,
  total_time_minutes INTEGER DEFAULT 0 NOT NULL,
  problems_solved INTEGER DEFAULT 0 NOT NULL,
  last_submission_time TIMESTAMP,
  rank INTEGER,
  UNIQUE(contest_id, user_id)
);

-- Admin Question Management
CREATE TABLE admin_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  difficulty difficulty NOT NULL,
  points INTEGER DEFAULT 100 NOT NULL,
  time_limit_seconds INTEGER DEFAULT 2 NOT NULL,
  memory_limit_mb INTEGER DEFAULT 256 NOT NULL,
  topics TEXT[] DEFAULT '{}',
  created_by TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE admin_test_cases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  question_title TEXT NOT NULL REFERENCES admin_questions(title) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT false NOT NULL,
  is_hidden BOOLEAN DEFAULT false NOT NULL,
  points INTEGER DEFAULT 10 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat History System (Added from migration)
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Aptitude System Tables
CREATE TABLE questions (
  s_no SERIAL PRIMARY KEY,
  category TEXT,
  question TEXT NOT NULL,
  topic TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT
);

CREATE TABLE aptitude_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  time_taken INTEGER,
  completed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications System
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- DSA Topic Stats
CREATE TABLE dsa_topic_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  total_problems INTEGER DEFAULT 0 NOT NULL,
  solved_problems INTEGER DEFAULT 0 NOT NULL,
  easy_solved INTEGER DEFAULT 0 NOT NULL,
  medium_solved INTEGER DEFAULT 0 NOT NULL,
  hard_solved INTEGER DEFAULT 0 NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, topic_name)
);

-- Visible Problems
CREATE TABLE visible_problems (
  id BIGSERIAL PRIMARY KEY,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(problem_id)
);

-- ============================================
-- STEP 4: CREATE ALL INDEXES
-- ============================================

-- Auth Tables
CREATE INDEX idx_account_user_id ON account("userId");
CREATE INDEX idx_session_user_id ON session("userId");

-- Jobs
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);

-- Problems
CREATE INDEX problems_slug_idx ON problems(slug);
CREATE INDEX problems_difficulty_idx ON problems(difficulty);
CREATE INDEX problems_created_at_idx ON problems(created_at);
CREATE INDEX problems_platform_idx ON problems(platform);
CREATE INDEX problems_company_tags_idx ON problems USING GIN(company_tags);
CREATE INDEX problems_topic_tags_idx ON problems USING GIN(topic_tags);

-- User Progress
CREATE INDEX user_progress_user_id_idx ON user_progress(user_id);
CREATE INDEX user_progress_problem_id_idx ON user_progress(problem_id);
CREATE INDEX user_progress_user_problem_idx ON user_progress(user_id, problem_id);
CREATE INDEX user_progress_status_idx ON user_progress(status);

-- Roadmaps
CREATE INDEX idx_roadmaps_category ON roadmaps(category);
CREATE INDEX idx_roadmaps_is_active ON roadmaps(is_active);
CREATE INDEX idx_roadmaps_created_by ON roadmaps(created_by);
CREATE INDEX idx_roadmap_steps_roadmap_id ON roadmap_steps(roadmap_id);
CREATE INDEX idx_roadmap_steps_order ON roadmap_steps(roadmap_id, order_index);
CREATE INDEX idx_user_roadmap_progress_user_id ON user_roadmap_progress(user_id);
CREATE INDEX idx_user_roadmap_progress_roadmap_id ON user_roadmap_progress(roadmap_id);

-- Contests
CREATE INDEX idx_contests_slug ON contests(slug);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_created_by ON contests(created_by);
CREATE INDEX idx_contests_start_time ON contests(start_time);
CREATE INDEX idx_contest_questions_contest_id ON contest_questions(contest_id);
CREATE INDEX idx_contest_test_cases_question_id ON contest_test_cases(question_id);
CREATE INDEX idx_contest_participants_contest_id ON contest_participants(contest_id);
CREATE INDEX idx_contest_participants_user_id ON contest_participants(user_id);
CREATE INDEX idx_contest_submissions_contest_id ON contest_submissions(contest_id);
CREATE INDEX idx_contest_submissions_user_id ON contest_submissions(user_id);
CREATE INDEX idx_contest_submissions_question_id ON contest_submissions(question_id);
CREATE INDEX idx_contest_leaderboard_contest_id ON contest_leaderboard(contest_id);
CREATE INDEX idx_contest_leaderboard_rank ON contest_leaderboard(contest_id, rank);

-- Admin Questions
CREATE INDEX idx_admin_questions_title ON admin_questions(title);
CREATE INDEX idx_admin_questions_difficulty ON admin_questions(difficulty);
CREATE INDEX idx_admin_questions_created_by ON admin_questions(created_by);
CREATE INDEX idx_admin_questions_is_active ON admin_questions(is_active);
CREATE INDEX idx_admin_questions_topics ON admin_questions USING GIN(topics);
CREATE INDEX idx_admin_test_cases_question_title ON admin_test_cases(question_title);
CREATE INDEX idx_admin_test_cases_is_sample ON admin_test_cases(is_sample);
CREATE INDEX idx_admin_test_cases_is_hidden ON admin_test_cases(is_hidden);

-- Chat History
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Aptitude
CREATE INDEX idx_aptitude_results_user_id ON aptitude_results(user_id);
CREATE INDEX idx_aptitude_results_topic ON aptitude_results(topic);
CREATE INDEX idx_aptitude_results_completed_at ON aptitude_results(completed_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- DSA Topic Stats
CREATE INDEX idx_dsa_topic_stats_user_id ON dsa_topic_stats(user_id);
CREATE INDEX idx_dsa_topic_stats_topic_name ON dsa_topic_stats(topic_name);

-- Visible Problems
CREATE INDEX idx_visible_problems_problem_id ON visible_problems(problem_id);
CREATE INDEX idx_visible_problems_is_visible ON visible_problems(is_visible);

-- ============================================
-- STEP 5: CREATE TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
BEFORE UPDATE ON problems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at
BEFORE UPDATE ON roadmaps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_last_updated
BEFORE UPDATE ON user_roadmap_progress
FOR EACH ROW
EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_contests_updated_at
BEFORE UPDATE ON contests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_questions_updated_at
BEFORE UPDATE ON admin_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

CREATE TRIGGER update_visible_problems_updated_at
BEFORE UPDATE ON visible_problems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: COPY ALL DATA FROM ORIGINAL DATABASE
-- ============================================

-- NOTE: Run these commands using pg_dump and psql
-- Replace 'talentpath_original' with your source database name
-- Replace 'talentpath_clone' with your target database name

/*
# Export data from original database:
pg_dump -h localhost -U postgres -d talentpath_original --data-only --inserts > talentpath_data.sql

# Import data to cloned database:
psql -h localhost -U postgres -d talentpath_clone < talentpath_data.sql

# Or use this one-liner to clone everything (structure + data):
pg_dump -h localhost -U postgres -d talentpath_original | psql -h localhost -U postgres -d talentpath_clone
*/

-- ============================================
-- ALTERNATIVE: COPY DATA TABLE BY TABLE
-- ============================================

-- If you want to copy data selectively, use these commands:

/*
-- Connect to source database
\c talentpath_original

-- Export each table
\copy "user" TO '/tmp/user.csv' CSV HEADER;
\copy account TO '/tmp/account.csv' CSV HEADER;
\copy session TO '/tmp/session.csv' CSV HEADER;
\copy jobs TO '/tmp/jobs.csv' CSV HEADER;
\copy problems TO '/tmp/problems.csv' CSV HEADER;
\copy user_progress TO '/tmp/user_progress.csv' CSV HEADER;
\copy companies TO '/tmp/companies.csv' CSV HEADER;
\copy topics TO '/tmp/topics.csv' CSV HEADER;
\copy roadmaps TO '/tmp/roadmaps.csv' CSV HEADER;
\copy roadmap_steps TO '/tmp/roadmap_steps.csv' CSV HEADER;
\copy user_roadmap_progress TO '/tmp/user_roadmap_progress.csv' CSV HEADER;
\copy contests TO '/tmp/contests.csv' CSV HEADER;
\copy contest_questions TO '/tmp/contest_questions.csv' CSV HEADER;
\copy contest_test_cases TO '/tmp/contest_test_cases.csv' CSV HEADER;
\copy contest_participants TO '/tmp/contest_participants.csv' CSV HEADER;
\copy contest_submissions TO '/tmp/contest_submissions.csv' CSV HEADER;
\copy contest_leaderboard TO '/tmp/contest_leaderboard.csv' CSV HEADER;
\copy admin_questions TO '/tmp/admin_questions.csv' CSV HEADER;
\copy admin_test_cases TO '/tmp/admin_test_cases.csv' CSV HEADER;
\copy chat_conversations TO '/tmp/chat_conversations.csv' CSV HEADER;
\copy chat_messages TO '/tmp/chat_messages.csv' CSV HEADER;
\copy questions TO '/tmp/questions.csv' CSV HEADER;
\copy aptitude_results TO '/tmp/aptitude_results.csv' CSV HEADER;
\copy notifications TO '/tmp/notifications.csv' CSV HEADER;
\copy dsa_topic_stats TO '/tmp/dsa_topic_stats.csv' CSV HEADER;
\copy visible_problems TO '/tmp/visible_problems.csv' CSV HEADER;

-- Connect to target database
\c talentpath_clone

-- Import each table
\copy "user" FROM '/tmp/user.csv' CSV HEADER;
\copy account FROM '/tmp/account.csv' CSV HEADER;
\copy session FROM '/tmp/session.csv' CSV HEADER;
\copy jobs FROM '/tmp/jobs.csv' CSV HEADER;
\copy problems FROM '/tmp/problems.csv' CSV HEADER;
\copy user_progress FROM '/tmp/user_progress.csv' CSV HEADER;
\copy companies FROM '/tmp/companies.csv' CSV HEADER;
\copy topics FROM '/tmp/topics.csv' CSV HEADER;
\copy roadmaps FROM '/tmp/roadmaps.csv' CSV HEADER;
\copy roadmap_steps FROM '/tmp/roadmap_steps.csv' CSV HEADER;
\copy user_roadmap_progress FROM '/tmp/user_roadmap_progress.csv' CSV HEADER;
\copy contests FROM '/tmp/contests.csv' CSV HEADER;
\copy contest_questions FROM '/tmp/contest_questions.csv' CSV HEADER;
\copy contest_test_cases FROM '/tmp/contest_test_cases.csv' CSV HEADER;
\copy contest_participants FROM '/tmp/contest_participants.csv' CSV HEADER;
\copy contest_submissions FROM '/tmp/contest_submissions.csv' CSV HEADER;
\copy contest_leaderboard FROM '/tmp/contest_leaderboard.csv' CSV HEADER;
\copy admin_questions FROM '/tmp/admin_questions.csv' CSV HEADER;
\copy admin_test_cases FROM '/tmp/admin_test_cases.csv' CSV HEADER;
\copy chat_conversations FROM '/tmp/chat_conversations.csv' CSV HEADER;
\copy chat_messages FROM '/tmp/chat_messages.csv' CSV HEADER;
\copy questions FROM '/tmp/questions.csv' CSV HEADER;
\copy aptitude_results FROM '/tmp/aptitude_results.csv' CSV HEADER;
\copy notifications FROM '/tmp/notifications.csv' CSV HEADER;
\copy dsa_topic_stats FROM '/tmp/dsa_topic_stats.csv' CSV HEADER;
\copy visible_problems FROM '/tmp/visible_problems.csv' CSV HEADER;
*/

-- ============================================
-- STEP 8: RESET SEQUENCES (IMPORTANT!)
-- ============================================

-- After importing data, reset auto-increment sequences:
SELECT setval('problems_id_seq', (SELECT MAX(id) FROM problems));
SELECT setval('user_progress_id_seq', (SELECT MAX(id) FROM user_progress));
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));
SELECT setval('visible_problems_id_seq', (SELECT MAX(id) FROM visible_problems));
SELECT setval('questions_s_no_seq', (SELECT MAX(s_no) FROM questions));

-- ============================================
-- STEP 9: VERIFY THE CLONE
-- ============================================

-- Check table counts:
SELECT 'users' as table_name, COUNT(*) as count FROM "user"
UNION ALL SELECT 'problems', COUNT(*) FROM problems
UNION ALL SELECT 'user_progress', COUNT(*) FROM user_progress
UNION ALL SELECT 'jobs', COUNT(*) FROM jobs
UNION ALL SELECT 'roadmaps', COUNT(*) FROM roadmaps
UNION ALL SELECT 'contests', COUNT(*) FROM contests
UNION ALL SELECT 'chat_conversations', COUNT(*) FROM chat_conversations
UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL SELECT 'admin_questions', COUNT(*) FROM admin_questions
UNION ALL SELECT 'aptitude_questions', COUNT(*) FROM questions
ORDER BY table_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE CLONE SCHEMA CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Create new database: CREATE DATABASE talentpath_clone;';
  RAISE NOTICE '2. Run this script on the new database';
  RAISE NOTICE '3. Use pg_dump to copy data from original';
  RAISE NOTICE '4. Reset sequences';
  RAISE NOTICE '5. Verify data integrity';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Tables Created: 25';
  RAISE NOTICE '📊 Indexes Created: 50+';
  RAISE NOTICE '📊 Triggers Created: 10';
  RAISE NOTICE '========================================';
END $$;
