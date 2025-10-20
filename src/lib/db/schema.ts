// ============================================
// COMPLETE DRIZZLE SCHEMA
// TalentPath + Contest + Admin Question System
// src/db/schema.ts
// ============================================

import { 
  pgTable, 
  text, 
  timestamp, 
  pgEnum, 
  primaryKey, 
  integer, 
  boolean,
  bigserial,
  bigint,
  decimal,
  jsonb,
  index 
} from 'drizzle-orm/pg-core';

// ============================================
// ENUM DEFINITIONS
// ============================================

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'internship']);
export const locationTypeEnum = pgEnum('location_type', ['remote', 'onsite', 'hybrid']);
export const difficultyEnum = pgEnum('difficulty', ['EASY', 'MEDIUM', 'HARD']);
export const platformEnum = pgEnum('platform', ['LEETCODE', 'CODEFORCES', 'HACKERRANK', 'GEEKSFORGEEKS']);
export const progressStatusEnum = pgEnum('progress_status', ['solved', 'attempted', 'bookmarked']);
export const roadmapCategoryEnum = pgEnum('roadmap_category', [
  'frontend', 'backend', 'fullstack', 'devops', 'mobile', 
  'data-science', 'ai-ml', 'cybersecurity', 'other'
]);
export const contestStatusEnum = pgEnum('contest_status', ['draft', 'upcoming', 'live', 'ended']);
export const contestVisibilityEnum = pgEnum('contest_visibility', ['public', 'private']);
export const submissionVerdictEnum = pgEnum('submission_verdict', [
  'pending', 'accepted', 'wrong_answer', 'runtime_error', 
  'time_limit_exceeded', 'compilation_error'
]);

// ============================================
// AUTH & USER TABLES
// ============================================

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
  userIdIdx: index('idx_account_user_id').on(account.userId),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  userIdIdx: index('idx_session_user_id').on(table.userId),
}));

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ============================================
// JOBS SYSTEM TABLES
// ============================================

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  locationType: locationTypeEnum('location_type').notNull(),
  jobType: jobTypeEnum('job_type').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(),
  salary: text('salary'),
  applyUrl: text('apply_url').notNull(),
  companyLogo: text('company_logo'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  createdByIdx: index('idx_jobs_created_by').on(table.createdBy),
  isActiveIdx: index('idx_jobs_is_active').on(table.isActive),
  createdAtIdx: index('idx_jobs_created_at').on(table.createdAt),
  companyIdx: index('idx_jobs_company').on(table.company),
  locationTypeIdx: index('idx_jobs_location_type').on(table.locationType),
  jobTypeIdx: index('idx_jobs_job_type').on(table.jobType),
}));

// ============================================
// PROBLEMS SYSTEM TABLES
// ============================================

export const problems = pgTable('problems', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  isPremium: boolean('is_premium').default(false).notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  platform: platformEnum('platform').default('LEETCODE').notNull(),
  likes: integer('likes').default(0).notNull(),
  dislikes: integer('dislikes').default(0).notNull(),
  acceptanceRate: decimal('acceptance_rate', { precision: 5, scale: 2 }),
  url: text('url'),
  topicTags: text('topic_tags').array().default([]).notNull(),
  companyTags: text('company_tags').array().default([]).notNull(),
  mainTopics: text('main_topics').array().default([]).notNull(),
  topicSlugs: text('topic_slugs').array().default([]).notNull(),
  accepted: bigint('accepted', { mode: 'number' }).default(0),
  submissions: bigint('submissions', { mode: 'number' }).default(0),
  similarQuestions: jsonb('similar_questions').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('problems_slug_idx').on(table.slug),
  difficultyIdx: index('problems_difficulty_idx').on(table.difficulty),
  createdAtIdx: index('problems_created_at_idx').on(table.createdAt),
  platformIdx: index('problems_platform_idx').on(table.platform),
  companyTagsIdx: index('problems_company_tags_idx').on(table.companyTags),
  topicTagsIdx: index('problems_topic_tags_idx').on(table.topicTags),
}));


export const userProgress = pgTable('user_progress', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  problemId: bigint('problem_id', { mode: 'number' }).notNull().references(() => problems.id, { onDelete: 'cascade' }),
  status: progressStatusEnum('status').notNull(),
  code: text('code'),
  language: text('language'),
  solvedAt: timestamp('solved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_progress_user_id_idx').on(table.userId),
  problemIdIdx: index('user_progress_problem_id_idx').on(table.problemId),
  userProblemIdx: index('user_progress_user_problem_idx').on(table.userId, table.problemId),
  statusIdx: index('user_progress_status_idx').on(table.status),
}));

export const companies = pgTable('companies', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const topics = pgTable('topics', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// ROADMAPS SYSTEM TABLES
// ============================================

export const roadmaps = pgTable('roadmaps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: roadmapCategoryEnum('category').notNull(),
  difficulty: text('difficulty').notNull(),
  estimatedTime: text('estimated_time'),
  icon: text('icon'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_roadmaps_category').on(table.category),
  isActiveIdx: index('idx_roadmaps_is_active').on(table.isActive),
  createdByIdx: index('idx_roadmaps_created_by').on(table.createdBy),
}));

export const roadmapSteps = pgTable('roadmap_steps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roadmapId: text('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  resources: text('resources'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  roadmapIdIdx: index('idx_roadmap_steps_roadmap_id').on(table.roadmapId),
  orderIdx: index('idx_roadmap_steps_order').on(table.roadmapId, table.orderIndex),
}));

export const userRoadmapProgress = pgTable('user_roadmap_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roadmapId: text('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  completedSteps: text('completed_steps').default('[]').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_user_roadmap_progress_user_id').on(table.userId),
  roadmapIdIdx: index('idx_user_roadmap_progress_roadmap_id').on(table.roadmapId),
}));

// ============================================
// CONTEST SYSTEM TABLES
// ============================================

export const contests = pgTable('contests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  status: contestStatusEnum('status').default('draft').notNull(),
  visibility: contestVisibilityEnum('visibility').default('public').notNull(),
  accessCode: text('access_code'),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('idx_contests_slug').on(table.slug),
  statusIdx: index('idx_contests_status').on(table.status),
  createdByIdx: index('idx_contests_created_by').on(table.createdBy),
  startTimeIdx: index('idx_contests_start_time').on(table.startTime),
}));

export const contestQuestions = pgTable('contest_questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contestId: text('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  points: integer('points').default(100).notNull(),
  orderIndex: integer('order_index').notNull(),
  timeLimitSeconds: integer('time_limit_seconds').default(2),
  memoryLimitMb: integer('memory_limit_mb').default(256),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  contestIdIdx: index('idx_contest_questions_contest_id').on(table.contestId),
  orderIdx: index('idx_contest_questions_order').on(table.contestId, table.orderIndex),
}));

export const contestTestCases = pgTable('contest_test_cases', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  questionId: text('question_id').notNull().references(() => contestQuestions.id, { onDelete: 'cascade' }),
  input: text('input').notNull(),
  expectedOutput: text('expected_output').notNull(),
  isSample: boolean('is_sample').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  points: integer('points').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  questionIdIdx: index('idx_contest_test_cases_question_id').on(table.questionId),
  sampleIdx: index('idx_contest_test_cases_sample').on(table.isSample),
}));

export const contestParticipants = pgTable('contest_participants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contestId: text('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  contestIdIdx: index('idx_contest_participants_contest_id').on(table.contestId),
  userIdIdx: index('idx_contest_participants_user_id').on(table.userId),
}));

export const contestSubmissions = pgTable('contest_submissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contestId: text('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => contestQuestions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  language: text('language').notNull(),
  verdict: submissionVerdictEnum('verdict').default('pending').notNull(),
  score: integer('score').default(0).notNull(),
  passedTestCases: integer('passed_test_cases').default(0).notNull(),
  totalTestCases: integer('total_test_cases').default(0).notNull(),
  executionTimeMs: integer('execution_time_ms'),
  memoryUsedKb: integer('memory_used_kb'),
  errorMessage: text('error_message'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => ({
  contestIdIdx: index('idx_contest_submissions_contest_id').on(table.contestId),
  userIdIdx: index('idx_contest_submissions_user_id').on(table.userId),
  questionIdIdx: index('idx_contest_submissions_question_id').on(table.questionId),
  verdictIdx: index('idx_contest_submissions_verdict').on(table.verdict),
  submittedAtIdx: index('idx_contest_submissions_submitted_at').on(table.submittedAt),
}));

export const contestLeaderboard = pgTable('contest_leaderboard', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contestId: text('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalScore: integer('total_score').default(0).notNull(),
  totalTimeMinutes: integer('total_time_minutes').default(0).notNull(),
  problemsSolved: integer('problems_solved').default(0).notNull(),
  lastSubmissionTime: timestamp('last_submission_time'),
  rank: integer('rank'),
}, (table) => ({
  contestIdIdx: index('idx_contest_leaderboard_contest_id').on(table.contestId),
  rankIdx: index('idx_contest_leaderboard_rank').on(table.contestId, table.rank),
}));

// ============================================
// ADMIN QUESTION MANAGEMENT SYSTEM
// ============================================

export const adminQuestions = pgTable('admin_questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull().unique(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  points: integer('points').default(100).notNull(),
  timeLimitSeconds: integer('time_limit_seconds').default(2).notNull(),
  memoryLimitMb: integer('memory_limit_mb').default(256).notNull(),
  topics: text('topics').array().default([]).notNull(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  titleIdx: index('idx_admin_questions_title').on(table.title),
  difficultyIdx: index('idx_admin_questions_difficulty').on(table.difficulty),
  createdByIdx: index('idx_admin_questions_created_by').on(table.createdBy),
  isActiveIdx: index('idx_admin_questions_is_active').on(table.isActive),
  topicsIdx: index('idx_admin_questions_topics').on(table.topics),
}));

export const adminTestCases = pgTable('admin_test_cases', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  questionTitle: text('question_title').notNull().references(() => adminQuestions.title, { onDelete: 'cascade' }),
  input: text('input').notNull(),
  expectedOutput: text('expected_output').notNull(),
  isSample: boolean('is_sample').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  points: integer('points').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  questionTitleIdx: index('idx_admin_test_cases_question_title').on(table.questionTitle),
  isSampleIdx: index('idx_admin_test_cases_is_sample').on(table.isSample),
  isHiddenIdx: index('idx_admin_test_cases_is_hidden').on(table.isHidden),
}));

// ============================================
// TYPE EXPORTS
// ============================================

// Auth Types
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type VerificationTokenInsert = typeof verificationTokens.$inferInsert;

// Jobs Types
export type Job = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;

// Problems Types
export type Problem = typeof problems.$inferSelect;
export type ProblemInsert = typeof problems.$inferInsert;
export type NewProblem = typeof problems.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type UserProgressInsert = typeof userProgress.$inferInsert;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type CompanyInsert = typeof companies.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type TopicInsert = typeof topics.$inferInsert;

// Roadmaps Types
export type Roadmap = typeof roadmaps.$inferSelect;
export type RoadmapInsert = typeof roadmaps.$inferInsert;
export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type RoadmapStepInsert = typeof roadmapSteps.$inferInsert;
export type UserRoadmapProgress = typeof userRoadmapProgress.$inferSelect;
export type UserRoadmapProgressInsert = typeof userRoadmapProgress.$inferInsert;

// Contest Types
export type Contest = typeof contests.$inferSelect;
export type ContestInsert = typeof contests.$inferInsert;
export type ContestQuestion = typeof contestQuestions.$inferSelect;
export type ContestQuestionInsert = typeof contestQuestions.$inferInsert;
export type ContestTestCase = typeof contestTestCases.$inferSelect;
export type ContestTestCaseInsert = typeof contestTestCases.$inferInsert;
export type ContestParticipant = typeof contestParticipants.$inferSelect;
export type ContestParticipantInsert = typeof contestParticipants.$inferInsert;
export type ContestSubmission = typeof contestSubmissions.$inferSelect;
export type ContestSubmissionInsert = typeof contestSubmissions.$inferInsert;
export type ContestLeaderboard = typeof contestLeaderboard.$inferSelect;
export type ContestLeaderboardInsert = typeof contestLeaderboard.$inferInsert;

// Admin Question Types
export type AdminQuestion = typeof adminQuestions.$inferSelect;
export type AdminQuestionInsert = typeof adminQuestions.$inferInsert;
export type AdminTestCase = typeof adminTestCases.$inferSelect;
export type AdminTestCaseInsert = typeof adminTestCases.$inferInsert;

// ============================================
// HELPER TYPES
// ============================================

export type ProblemWithProgress = Problem & {
  progress?: UserProgress;
};

export type ContestWithDetails = Contest & {
  questionCount?: number;
  participantCount?: number;
};

export type AdminQuestionWithTestCases = AdminQuestion & {
  testCases: AdminTestCase[];
};

// ============================================
// ENUM VALUE TYPES
// ============================================

export type Role = 'user' | 'admin';
export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type LocationType = 'remote' | 'onsite' | 'hybrid';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Platform = 'LEETCODE' | 'CODEFORCES' | 'HACKERRANK' | 'GEEKSFORGEEKS';
export type ProgressStatus = 'solved' | 'attempted' | 'bookmarked';
export type RoadmapCategory = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'mobile' | 'data-science' | 'ai-ml' | 'cybersecurity' | 'other';
export type ContestStatus = 'draft' | 'upcoming' | 'live' | 'ended';
export type ContestVisibility = 'public' | 'private';
export type SubmissionVerdict = 'pending' | 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'compilation_error';
