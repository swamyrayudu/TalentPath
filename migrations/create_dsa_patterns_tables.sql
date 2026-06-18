-- ============================================
-- CREATE DSA PATTERNS & PATTERN PROBLEMS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS dsa_patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS pattern_problems (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES dsa_patterns(id) ON DELETE CASCADE,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_pattern_problem UNIQUE (pattern_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_problems_pattern_id ON pattern_problems(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_problems_problem_id ON pattern_problems(problem_id);
