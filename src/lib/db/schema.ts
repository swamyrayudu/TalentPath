import { pgTable, text, timestamp, pgEnum, primaryKey, integer, boolean } from 'drizzle-orm/pg-core';

// Enums
export const roleEnum = pgEnum('role', ['user', 'admin']);

export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'internship']);

export const locationTypeEnum = pgEnum('location_type', ['remote', 'onsite', 'hybrid']);

export const roadmapCategoryEnum = pgEnum('roadmap_category', [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'mobile',
  'data-science',
  'ai-ml',
  'cybersecurity',
  'other'
]);

// User tables
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

// Jobs table
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

// Roadmaps tables
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

// Type exports
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobInsert = typeof jobs.$inferInsert;
export type Roadmap = typeof roadmaps.$inferSelect;
export type RoadmapStep = typeof roadmapSteps.$inferSelect;
export type UserRoadmapProgress = typeof userRoadmapProgress.$inferSelect;
