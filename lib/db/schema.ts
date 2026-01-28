import { pgTable, uuid, text, timestamp, integer, numeric, boolean, date, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================
// IDEAS - Programovaci napady
// ============================================
export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  links: text('links').array().default(sql`'{}'::text[]`),
  status: text('status').default('todo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_ideas_user_id').on(table.userId),
])

// ============================================
// DEPLOYMENTS - Sprava sluzeb
// ============================================
export const deployments = pgTable('deployments', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  project: text('project').notNull(),
  platform: text('platform'),
  urlIp: text('url_ip'),
  status: text('status').default('running'),
  lastPing: timestamp('last_ping', { withTimezone: true }),
  description: text('description'),
  links: text('links').array().default(sql`'{}'::text[]`),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_deployments_user_id').on(table.userId),
])

// ============================================
// LINK_CATEGORIES - Kategorie odkazu
// ============================================
export const linkCategories = pgTable('link_categories', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon').default('📁'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_link_categories_user_id').on(table.userId),
  unique('link_categories_user_id_name_unique').on(table.userId, table.name),
])

// ============================================
// LINKS - Ulozene odkazy
// ============================================
export const links = pgTable('links', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  categoryId: uuid('category_id').references(() => linkCategories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_links_user_id').on(table.userId),
  index('idx_links_category_id').on(table.categoryId),
])

// ============================================
// APP_SETTINGS - Globalni nastaveni aplikace
// ============================================
export const appSettings = pgTable('app_settings', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ============================================
// ALLOWED_USERS - Whitelist povolenych uzivatelu
// ============================================
export const allowedUsers = pgTable('allowed_users', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  email: text('email').notNull().unique(),
  addedBy: text('added_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ============================================
// SUBSCRIPTIONS - Sledovani SaaS nakladu
// ============================================
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  name: text('name').notNull(),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('CZK'),
  frequency: text('frequency').notNull(),
  category: text('category'),
  nextBillingDate: date('next_billing_date'),
  paymentType: text('payment_type').notNull(),
  priority: integer('priority').notNull().default(2),
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('idx_subscriptions_user_id').on(table.userId),
  index('idx_subscriptions_is_active').on(table.isActive),
  index('idx_subscriptions_next_billing').on(table.nextBillingDate),
])

// ============================================
// AUDIO_NOTES - Hlasove poznamky
// ============================================
export const audioNotes = pgTable('audio_notes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  audioPath: text('audio_path').notNull(),
  transcription: text('transcription'),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
}, (table) => [
  index('idx_audio_notes_user_id').on(table.userId),
  index('idx_audio_notes_status').on(table.status),
  index('idx_audio_notes_created_at').on(table.createdAt),
])

// Type exports
export type Idea = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert

export type Deployment = typeof deployments.$inferSelect
export type NewDeployment = typeof deployments.$inferInsert

export type LinkCategory = typeof linkCategories.$inferSelect
export type NewLinkCategory = typeof linkCategories.$inferInsert

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert

export type AppSetting = typeof appSettings.$inferSelect
export type AllowedUser = typeof allowedUsers.$inferSelect

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert

export type AudioNote = typeof audioNotes.$inferSelect
export type NewAudioNote = typeof audioNotes.$inferInsert
