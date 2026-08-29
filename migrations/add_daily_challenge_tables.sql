-- Daily challenge: one problem per day (LeetCode-style) plus per-user completions.
-- The challenge row for a day is created lazily the first time that day is requested,
-- so no cron job is required to keep the calendar filled.

CREATE TABLE IF NOT EXISTS "daily_challenges" (
    "id" TEXT PRIMARY KEY,
    "challenge_date" DATE NOT NULL UNIQUE,
    "problem_id" BIGINT NOT NULL,
    "difficulty" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_daily_challenges_date" ON "daily_challenges" ("challenge_date" DESC);

CREATE TABLE IF NOT EXISTS "daily_challenge_completions" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "challenge_date" DATE NOT NULL,
    "problem_id" BIGINT NOT NULL,
    "completed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- One completion per user per day is what makes the streak arithmetic honest.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_daily_completions_user_date"
    ON "daily_challenge_completions" ("user_id", "challenge_date");

CREATE INDEX IF NOT EXISTS "idx_daily_completions_user"
    ON "daily_challenge_completions" ("user_id", "challenge_date" DESC);

ALTER TABLE "daily_challenge_completions"
    DROP CONSTRAINT IF EXISTS "daily_challenge_completions_user_id_fkey";

ALTER TABLE "daily_challenge_completions"
    ADD CONSTRAINT "daily_challenge_completions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;
