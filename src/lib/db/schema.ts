import { pgTable, text, timestamp, pgEnum, primaryKey, integer, boolean } from 'drizzle-orm/pg-core';
import { bigserial, bigint, decimal, jsonb, index } from 'drizzle-orm/pg-core';

// ============================================
// ENUMS
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

// ============================================
// AUTH TABLES
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
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ============================================
// JOBS TABLE
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
});

// ============================================
// PROBLEMS TABLES
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
  uniqueUserProblem: index('unique_user_problem').on(table.userId, table.problemId),
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
// ROADMAPS TABLES
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
});

export const roadmapSteps = pgTable('roadmap_steps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roadmapId: text('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  resources: text('resources'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRoadmapProgress = pgTable('user_roadmap_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roadmapId: text('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  completedSteps: text('completed_steps').default('[]').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type CompanyInsert = typeof companies.$inferInsert;

export type Topic = typeof topics.$inferSelect;
export type TopicInsert = typeof topics.$inferInsert;

export type Roadmap = typeof roadmaps.$inferSelect;
export type RoadmapInsert = typeof roadmaps.$inferInsert;

export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type RoadmapStepInsert = typeof roadmapSteps.$inferInsert;

export type UserRoadmapProgress = typeof userRoadmapProgress.$inferSelect;
export type UserRoadmapProgressInsert = typeof userRoadmapProgress.$inferInsert;
