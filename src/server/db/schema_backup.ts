import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const savedEvents = mysqlTable('savedEvents', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: varchar('eventId', { length: 255 }).notNull(),
  eventTitle: text('eventTitle'),
  eventDate: varchar('eventDate', { length: 100 }),
  eventCity: varchar('eventCity', { length: 100 }).notNull(),
  savedAt: timestamp('savedAt').defaultNow().notNull(),
});

export type SavedEvent = typeof savedEvents.$inferSelect;
export type InsertSavedEvent = typeof savedEvents.$inferInsert;

export const events = mysqlTable('events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  image: text('image'),
  date: varchar('date', { length: 50 }).notNull(),
  time: varchar('time', { length: 50 }).notNull(),
  venue: text('venue').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  citySlug: varchar('citySlug', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  price: varchar('price', { length: 50 }),
  interested: int('interested').default(0),
  tags: text('tags'), // JSON array as string
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  isFeatured: int('isFeatured').default(0),
  organizerId: int('organizerId').references(() => organizers.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const notificationPreferences = mysqlTable('notificationPreferences', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cities: text('cities'), // JSON array as string
  categories: text('categories'), // JSON array as string
  emailNotifications: int('emailNotifications').default(1),
  frequency: mysqlEnum('frequency', ['daily', 'weekly', 'immediately']).default('weekly'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const organizers = mysqlTable('organizers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 320 }),
  phone: varchar('phone', { length: 20 }),
  website: text('website'),
  description: text('description'),
  image: text('image'),
  verified: int('verified').default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Organizer = typeof organizers.$inferSelect;
export type InsertOrganizer = typeof organizers.$inferInsert;
