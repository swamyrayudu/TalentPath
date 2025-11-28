-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.account (
  userId text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT account_pkey PRIMARY KEY (provider, providerAccountId),
  CONSTRAINT account_userId_user_id_fk FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.admin_questions (
  id text NOT NULL,
  title text,
  description text,
  difficulty text,
  points bigint,
  time_limit_seconds bigint,
  memory_limit_mb bigint,
  topics text,
  created_by text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT admin_questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_test_cases (
  id text NOT NULL,
  question_title text NOT NULL,
  input text NOT NULL,
  expected_output text NOT NULL,
  is_sample boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 10,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_test_cases_pkey PRIMARY KEY (id)
);
CREATE TABLE public.alligation-or-mixture (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT alligation-or-mixture_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.aptitude_results (
  id text NOT NULL,
  user_id text NOT NULL,
  topic text NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score integer NOT NULL,
  time_taken integer,
  answers jsonb NOT NULL,
  completed_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT aptitude_results_pkey PRIMARY KEY (id),
  CONSTRAINT aptitude_results_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.area (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT area_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.average (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT average_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.bankers-discount (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT bankers-discount_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.boats-and-steams (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT boats-and-steams_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.calender (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT calender_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.chain-rule (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT chain-rule_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.chat_conversations (
  id text NOT NULL,
  user_id text NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversations_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.chat_messages (
  id text NOT NULL,
  conversation_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  reasoning text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_chat_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id)
);
CREATE TABLE public.clock (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT clock_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.companies (
  id bigint NOT NULL DEFAULT nextval('companies_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.compound-interest (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT compound-interest_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.contest_leaderboard (
  id text NOT NULL,
  contest_id text NOT NULL,
  user_id text NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  total_time_minutes integer NOT NULL DEFAULT 0,
  problems_solved integer NOT NULL DEFAULT 0,
  last_submission_time timestamp without time zone,
  rank integer,
  CONSTRAINT contest_leaderboard_pkey PRIMARY KEY (id),
  CONSTRAINT contest_leaderboard_contest_id_contests_id_fk FOREIGN KEY (contest_id) REFERENCES public.contests(id),
  CONSTRAINT contest_leaderboard_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.contest_participants (
  id text NOT NULL,
  contest_id text NOT NULL,
  user_id text NOT NULL,
  joined_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT contest_participants_pkey PRIMARY KEY (id),
  CONSTRAINT contest_participants_contest_id_contests_id_fk FOREIGN KEY (contest_id) REFERENCES public.contests(id),
  CONSTRAINT contest_participants_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.contest_questions (
  id text NOT NULL,
  contest_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty USER-DEFINED NOT NULL,
  points integer NOT NULL DEFAULT 100,
  order_index integer NOT NULL,
  time_limit_seconds integer DEFAULT 2,
  memory_limit_mb integer DEFAULT 256,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT contest_questions_pkey PRIMARY KEY (id),
  CONSTRAINT contest_questions_contest_id_contests_id_fk FOREIGN KEY (contest_id) REFERENCES public.contests(id)
);
CREATE TABLE public.contest_submissions (
  id text NOT NULL,
  contest_id text NOT NULL,
  question_id text NOT NULL,
  user_id text NOT NULL,
  code text NOT NULL,
  language text NOT NULL,
  verdict USER-DEFINED NOT NULL DEFAULT 'pending'::submission_verdict,
  score integer NOT NULL DEFAULT 0,
  passed_test_cases integer NOT NULL DEFAULT 0,
  total_test_cases integer NOT NULL DEFAULT 0,
  execution_time_ms integer,
  memory_used_kb integer,
  error_message text,
  submitted_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT contest_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT contest_submissions_contest_id_contests_id_fk FOREIGN KEY (contest_id) REFERENCES public.contests(id),
  CONSTRAINT contest_submissions_question_id_contest_questions_id_fk FOREIGN KEY (question_id) REFERENCES public.contest_questions(id),
  CONSTRAINT contest_submissions_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.contest_test_cases (
  id text NOT NULL,
  question_id text NOT NULL,
  input text NOT NULL,
  expected_output text NOT NULL,
  is_sample boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 10,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT contest_test_cases_pkey PRIMARY KEY (id),
  CONSTRAINT contest_test_cases_question_id_contest_questions_id_fk FOREIGN KEY (question_id) REFERENCES public.contest_questions(id)
);
CREATE TABLE public.contests (
  id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  slug text NOT NULL UNIQUE,
  start_time timestamp without time zone NOT NULL,
  end_time timestamp without time zone NOT NULL,
  duration_minutes integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::contest_status,
  visibility USER-DEFINED NOT NULL DEFAULT 'public'::contest_visibility,
  access_code text,
  created_by text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT contests_pkey PRIMARY KEY (id),
  CONSTRAINT contests_created_by_user_id_fk FOREIGN KEY (created_by) REFERENCES public.user(id)
);
CREATE TABLE public.decimal-fraction (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT decimal-fraction_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.dsa-topic-stats (
  id bigint NOT NULL,
  topic_slug text,
  topic_name text,
  difficulty text,
  platform text,
  total_count bigint,
  visible_count text,
  last_updated timestamp with time zone,
  CONSTRAINT dsa-topic-stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.dsa_topic_stats (
  id integer NOT NULL DEFAULT nextval('dsa_topic_stats_id_seq'::regclass),
  topic_slug character varying NOT NULL,
  topic_name character varying NOT NULL,
  difficulty USER-DEFINED NOT NULL,
  platform USER-DEFINED NOT NULL,
  total_count integer DEFAULT 0,
  last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT dsa_topic_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.height-and-distance (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT height-and-distance_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.interview_questions (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  interview_id text NOT NULL,
  question_number integer NOT NULL,
  question text NOT NULL,
  difficulty text,
  topics jsonb,
  expected_answer text,
  user_answer text,
  code text,
  language text,
  score integer,
  time_taken integer,
  feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  answered_at timestamp with time zone,
  max_score integer DEFAULT 100,
  status USER-DEFINED DEFAULT 'pending'::question_status,
  strengths jsonb,
  improvements jsonb,
  CONSTRAINT interview_questions_pkey PRIMARY KEY (id),
  CONSTRAINT interview_questions_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.mock_interviews(id)
);
CREATE TABLE public.interview_transcripts (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  interview_id text NOT NULL,
  question_id text,
  role text NOT NULL,
  message text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT interview_transcripts_pkey PRIMARY KEY (id),
  CONSTRAINT interview_transcripts_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.mock_interviews(id),
  CONSTRAINT interview_transcripts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.interview_questions(id),
  CONSTRAINT interview_transcripts_question_id_fk FOREIGN KEY (question_id) REFERENCES public.interview_questions(id)
);
CREATE TABLE public.jobs (
  id text NOT NULL,
  title text,
  company text,
  location text,
  location_type text,
  job_type text,
  description text,
  requirements text,
  salary text,
  apply_url text,
  company_logo text,
  is_active boolean,
  created_by text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logarithm (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT logarithm_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.mock_interviews (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id text NOT NULL,
  type USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'in-progress'::interview_status,
  difficulty text,
  company_name text,
  duration integer DEFAULT 0,
  score integer,
  feedback text,
  strengths jsonb,
  improvements jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  current_question_number integer DEFAULT 0,
  total_questions integer DEFAULT 10,
  total_score integer,
  average_score numeric,
  CONSTRAINT mock_interviews_pkey PRIMARY KEY (id),
  CONSTRAINT mock_interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.numbers (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT numbers_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.odd-man-out-and-series (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a bigint,
  option_b bigint,
  option_c bigint,
  option_d bigint,
  answer bigint,
  explanation text,
  CONSTRAINT odd-man-out-and-series_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.partnership (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT partnership_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.percentage (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT percentage_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.permutation-and-combination (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a bigint,
  option_b bigint,
  option_c bigint,
  option_d bigint,
  answer bigint,
  explanation text,
  CONSTRAINT permutation-and-combination_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.pipes-and-cistern (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT pipes-and-cistern_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.problems (
  id bigint NOT NULL,
  title text,
  slug text,
  is_premium boolean,
  difficulty text,
  platform text,
  likes text,
  dislikes text,
  acceptance_rate double precision,
  url text,
  topic_tags jsonb,
  company_tags jsonb,
  main_topics jsonb,
  topic_slugs jsonb,
  accepted text,
  submissions bigint,
  similar_questions jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_visible_to_users boolean,
  CONSTRAINT problems_pkey PRIMARY KEY (id)
);
CREATE TABLE public.problems-on-ages (
  s_no bigint,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text
);
CREATE TABLE public.problems-on-hcf-and-lcm (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT problems-on-hcf-and-lcm_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.problems-on-trains (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT problems-on-trains_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.probobility (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT probobility_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.profit-and-loss (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT profit-and-loss_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.questions (
  s_no integer NOT NULL DEFAULT nextval('questions_s_no_seq'::regclass),
  category text,
  question text NOT NULL,
  topic text NOT NULL,
  option_a text DEFAULT ''::text,
  option_b text DEFAULT ''::text,
  option_c text DEFAULT ''::text,
  option_d text DEFAULT ''::text,
  answer text,
  explanation text,
  CONSTRAINT questions_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.races-and-games (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT races-and-games_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.ratio-and-proportion (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT ratio-and-proportion_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.roadmap_steps (
  id text NOT NULL,
  roadmap_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  resources text,
  order_index integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT roadmap_steps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roadmaps (
  id text NOT NULL,
  title text,
  description text,
  category text,
  difficulty text,
  estimated_time text,
  icon text,
  is_active boolean,
  created_by text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT roadmaps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.session (
  sessionToken text NOT NULL,
  userId text NOT NULL,
  expires timestamp without time zone NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sessionToken),
  CONSTRAINT session_userId_user_id_fk FOREIGN KEY (userId) REFERENCES public.user(id)
);
CREATE TABLE public.simple-interest (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT simple-interest_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.simplification (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT simplification_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.square-root-and-cube-root (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b double precision,
  option_c text,
  option_d double precision,
  answer text,
  explanation text,
  CONSTRAINT square-root-and-cube-root_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.stocks-and-shares (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT stocks-and-shares_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.surds-and-indices (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a double precision,
  option_b text,
  option_c text,
  option_d text,
  answer double precision,
  explanation text,
  CONSTRAINT surds-and-indices_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.time-and-distance (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT time-and-distance_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.time-and-work (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT time-and-work_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.topics (
  id bigint NOT NULL DEFAULT nextval('topics_id_seq'::regclass),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT topics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.true-discount (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT true-discount_pkey PRIMARY KEY (s_no)
);
CREATE TABLE public.user (
  id text NOT NULL,
  name text,
  email text NOT NULL UNIQUE,
  emailVerified timestamp without time zone,
  image text,
  role USER-DEFINED NOT NULL DEFAULT 'user'::role,
  created_at timestamp without time zone DEFAULT now(),
  last_login_at timestamp without time zone,
  CONSTRAINT user_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_progress (
  id bigint NOT NULL,
  user_id text,
  problem_id bigint,
  status text,
  code text,
  language text,
  solved_at text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  CONSTRAINT user_progress_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roadmap_progress (
  id text NOT NULL,
  user_id text,
  roadmap_id text,
  completed_steps jsonb,
  started_at timestamp with time zone,
  last_updated timestamp with time zone,
  CONSTRAINT user_roadmap_progress_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verificationToken (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp without time zone NOT NULL,
  CONSTRAINT verificationToken_pkey PRIMARY KEY (identifier, token)
);
CREATE TABLE public.visible_problems (
  id bigint NOT NULL,
  title text,
  slug text UNIQUE,
  is_premium boolean,
  difficulty text,
  platform text,
  likes text,
  dislikes text,
  acceptance_rate double precision,
  url text,
  topic_tags jsonb,
  company_tags jsonb,
  main_topics jsonb,
  topic_slugs jsonb,
  accepted text,
  submissions bigint,
  similar_questions jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_visible_to_users boolean,
  CONSTRAINT visible_problems_pkey PRIMARY KEY (id)
);
CREATE TABLE public.volume-and-surface (
  s_no bigint NOT NULL,
  category text,
  question text,
  topic text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  answer text,
  explanation text,
  CONSTRAINT volume-and-surface_pkey PRIMARY KEY (s_no)
);