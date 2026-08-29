-- Aligns the live admin_questions / admin_test_cases tables with src/lib/db/schema.ts
-- before bulk-loading the contest problem bank.
--
-- Why this is needed:
--   * `topics` was created as `text` but is declared `text[]` in Drizzle, so the
--     Question Library's topic filter (`topics @> ARRAY[...]::text[]`) failed with
--     "operator does not exist: text @> text[]" on every use.
--   * `admin_test_cases.question_title` joins on `admin_questions.title`, but the
--     title had no unique index, so nothing stopped duplicate questions or orphaned
--     test cases.
--
-- Idempotent: safe to run more than once.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. topics: text -> text[]
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_questions'
      AND column_name = 'topics' AND data_type <> 'ARRAY'
  ) THEN
    -- No subqueries allowed in a USING expression, so the JSON-ish `["a","b"]`
    -- values already in the column are unwrapped with translate + string_to_array.
    ALTER TABLE public.admin_questions
      ALTER COLUMN topics TYPE text[]
      USING (
        CASE
          WHEN topics IS NULL THEN '{}'::text[]
          WHEN btrim(translate(topics, '[]{}" ', '')) = '' THEN '{}'::text[]
          WHEN btrim(topics) LIKE '{%' THEN btrim(topics)::text[]
          ELSE string_to_array(btrim(translate(topics, '[]"', '')), ',')
        END
      );
  END IF;
END $$;

UPDATE public.admin_questions SET topics = '{}'::text[] WHERE topics IS NULL;
ALTER TABLE public.admin_questions ALTER COLUMN topics SET DEFAULT '{}'::text[];
ALTER TABLE public.admin_questions ALTER COLUMN topics SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. is_active: make the library's primary filter reliable
-- ---------------------------------------------------------------------------
UPDATE public.admin_questions SET is_active = true WHERE is_active IS NULL;
ALTER TABLE public.admin_questions ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.admin_questions ALTER COLUMN is_active SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. title must be unique — admin_test_cases references it by value
-- ---------------------------------------------------------------------------
UPDATE public.admin_questions SET title = btrim(title) WHERE title <> btrim(title);
ALTER TABLE public.admin_questions ALTER COLUMN title SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS admin_questions_title_key
  ON public.admin_questions (title);

-- ---------------------------------------------------------------------------
-- 4. Foreign key so deleting a question removes its test cases
-- ---------------------------------------------------------------------------
DELETE FROM public.admin_test_cases tc
WHERE NOT EXISTS (SELECT 1 FROM public.admin_questions q WHERE q.title = tc.question_title);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_test_cases_question_title_fkey'
      AND conrelid = 'public.admin_test_cases'::regclass
  ) THEN
    ALTER TABLE public.admin_test_cases
      ADD CONSTRAINT admin_test_cases_question_title_fkey
      FOREIGN KEY (question_title)
      REFERENCES public.admin_questions (title)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Indexes the library's filters actually use
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_admin_questions_difficulty ON public.admin_questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_admin_questions_is_active  ON public.admin_questions (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_questions_created_at ON public.admin_questions (created_at DESC);
-- GIN, not btree: this is the index that makes `topics @> ARRAY[...]` fast.
CREATE INDEX IF NOT EXISTS idx_admin_questions_topics     ON public.admin_questions USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_admin_test_cases_question_title ON public.admin_test_cases (question_title);
CREATE INDEX IF NOT EXISTS idx_admin_test_cases_is_sample ON public.admin_test_cases (is_sample);

COMMIT;
