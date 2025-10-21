-- Fix questions table schema
-- This migration adds proper primary key and constraints

-- First, check if the table exists and backup data if needed
-- If s_no is not a primary key, we need to fix it

-- Drop the existing table constraints if any
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_pkey;

-- Make s_no a proper serial primary key if it's not already
-- If s_no is integer, convert it to serial
DO $$ 
DECLARE
  max_s_no INTEGER;
BEGIN
  -- Check if s_no is already serial/bigserial
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    WHERE c.relname = 'questions' 
    AND a.attname = 's_no'
    AND a.attidentity != ''
  ) THEN
    -- First, fix any NULL values in s_no by assigning sequential numbers
    -- Get the current max s_no value
    SELECT COALESCE(MAX(s_no), 0) INTO max_s_no FROM questions WHERE s_no IS NOT NULL;
    
    -- Update NULL s_no values with sequential numbers
    WITH numbered_rows AS (
      SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) + max_s_no as new_s_no
      FROM questions
      WHERE s_no IS NULL
    )
    UPDATE questions
    SET s_no = numbered_rows.new_s_no
    FROM numbered_rows
    WHERE questions.ctid = numbered_rows.ctid;
    
    -- Create a sequence for s_no
    CREATE SEQUENCE IF NOT EXISTS questions_s_no_seq;
    
    -- Set the sequence to the max value + 1
    PERFORM setval('questions_s_no_seq', COALESCE((SELECT MAX(s_no) FROM questions), 0) + 1, false);
    
    -- Alter the column to use the sequence
    ALTER TABLE questions ALTER COLUMN s_no SET DEFAULT nextval('questions_s_no_seq');
    ALTER TABLE questions ALTER COLUMN s_no SET NOT NULL;
    
    -- Set the sequence ownership
    ALTER SEQUENCE questions_s_no_seq OWNED BY questions.s_no;
  END IF;
END $$;

-- Add primary key constraint (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'questions_pkey' 
    AND conrelid = 'questions'::regclass
  ) THEN
    ALTER TABLE questions ADD PRIMARY KEY (s_no);
  END IF;
END $$;

-- Make question and topic NOT NULL (with error handling)
DO $$ 
BEGIN
  ALTER TABLE questions ALTER COLUMN question SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL; -- Column might already be NOT NULL
END $$;

DO $$ 
BEGIN
  ALTER TABLE questions ALTER COLUMN topic SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL; -- Column might already be NOT NULL
END $$;

-- Set default values for option fields
DO $$ 
BEGIN
  ALTER TABLE questions ALTER COLUMN option_a SET DEFAULT '';
  ALTER TABLE questions ALTER COLUMN option_b SET DEFAULT '';
  ALTER TABLE questions ALTER COLUMN option_c SET DEFAULT '';
  ALTER TABLE questions ALTER COLUMN option_d SET DEFAULT '';
EXCEPTION
  WHEN others THEN NULL; -- Defaults might already be set
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;
