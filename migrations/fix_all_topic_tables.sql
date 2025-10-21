-- Fix ALL topic-specific tables schema
-- This migration adds proper primary key and constraints to all topic tables

-- List of all topic tables
DO $$ 
DECLARE
  tbl_name TEXT;
  topic_tables TEXT[] := ARRAY[
    'alligation-or-mixture',
    'area',
    'average',
    'bankers-discount',
    'boats-and-streams',
    'calendar',
    'chain-rule',
    'clock',
    'compound-interest',
    'decimal-fraction',
    'height-and-distance',
    'logarithm',
    'numbers',
    'odd-man-out-and-series',
    'partnership',
    'percentage',
    'permutation-and-combination',
    'pipes-and-cistern',
    'probability',
    'problems-on-ages',
    'problems-on-hcf-and-lcm',
    'problems-on-numbers',
    'problems-on-trains',
    'profit-and-loss',
    'races-and-games',
    'ratio-and-proportion',
    'simple-interest',
    'simplification',
    'square-root-and-cube-root',
    'stocks-and-shares',
    'surds-and-indices',
    'time-and-work',
    'time-and-distance',
    'true-discount',
    'volume-and-surface-area'
  ];
  max_s_no INTEGER;
BEGIN
  FOREACH tbl_name IN ARRAY topic_tables
  LOOP
    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND information_schema.tables.table_name = tbl_name
    ) THEN
      RAISE NOTICE 'Processing table: %', tbl_name;
      
      -- Drop existing primary key if any (try multiple possible constraint names)
      BEGIN
        EXECUTE format('ALTER TABLE "%s" DROP CONSTRAINT IF EXISTS %I', tbl_name, tbl_name || '_pkey');
        EXECUTE format('ALTER TABLE "%s" DROP CONSTRAINT IF EXISTS %I', tbl_name, replace(tbl_name, '-', '_') || '_pkey');
      EXCEPTION
        WHEN others THEN NULL;
      END;
      
      -- Fix NULL values in s_no by assigning sequential numbers
      EXECUTE format('SELECT COALESCE(MAX(s_no), 0) FROM "%s" WHERE s_no IS NOT NULL', tbl_name) INTO max_s_no;
      
      EXECUTE format('
        WITH numbered_rows AS (
          SELECT ctid, ROW_NUMBER() OVER (ORDER BY ctid) + %s as new_s_no
          FROM "%s"
          WHERE s_no IS NULL
        )
        UPDATE "%s"
        SET s_no = numbered_rows.new_s_no
        FROM numbered_rows
        WHERE "%s".ctid = numbered_rows.ctid
      ', max_s_no, tbl_name, tbl_name, tbl_name);
      
      -- Create sequence for s_no
      EXECUTE format('CREATE SEQUENCE IF NOT EXISTS "%s_s_no_seq"', tbl_name);
      
      -- Set sequence to max value + 1
      EXECUTE format('SELECT setval(''"%s_s_no_seq"'', COALESCE((SELECT MAX(s_no) FROM "%s"), 0) + 1, false)', tbl_name, tbl_name);
      
      -- Set default and NOT NULL for s_no
      EXECUTE format('ALTER TABLE "%s" ALTER COLUMN s_no SET DEFAULT nextval(''"%s_s_no_seq"'')', tbl_name, tbl_name);
      EXECUTE format('ALTER TABLE "%s" ALTER COLUMN s_no SET NOT NULL', tbl_name);
      
      -- Set sequence ownership
      EXECUTE format('ALTER SEQUENCE "%s_s_no_seq" OWNED BY "%s".s_no', tbl_name, tbl_name);
      
      -- Add primary key (only if it doesn't exist)
      BEGIN
        EXECUTE format('ALTER TABLE "%s" ADD PRIMARY KEY (s_no)', tbl_name);
      EXCEPTION
        WHEN duplicate_table THEN 
          RAISE NOTICE 'Primary key already exists for table: %', tbl_name;
        WHEN others THEN 
          RAISE NOTICE 'Could not add primary key for table: %, error: %', tbl_name, SQLERRM;
      END;
      
      -- Make question and topic NOT NULL if columns exist
      BEGIN
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN question SET NOT NULL', tbl_name);
      EXCEPTION
        WHEN others THEN NULL;
      END;
      
      BEGIN
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN topic SET NOT NULL', tbl_name);
      EXCEPTION
        WHEN others THEN NULL;
      END;
      
      -- Set default values for option fields
      BEGIN
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN option_a SET DEFAULT ''''', tbl_name);
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN option_b SET DEFAULT ''''', tbl_name);
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN option_c SET DEFAULT ''''', tbl_name);
        EXECUTE format('ALTER TABLE "%s" ALTER COLUMN option_d SET DEFAULT ''''', tbl_name);
      EXCEPTION
        WHEN others THEN NULL;
      END;
      
      -- Create indexes
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_topic ON "%s"(topic)', replace(tbl_name, '-', '_'), tbl_name);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_category ON "%s"(category)', replace(tbl_name, '-', '_'), tbl_name);
      
      RAISE NOTICE 'Successfully processed table: %', tbl_name;
    ELSE
      RAISE NOTICE 'Table does not exist: %', tbl_name;
    END IF;
  END LOOP;
END $$;

-- Verify the changes for one sample table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'numbers'
ORDER BY ordinal_position;
