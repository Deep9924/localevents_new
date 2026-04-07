import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double } from "drizzle-orm/mysql-core";

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

export const cities = mysqlTable("cities", {
  slug: varchar("slug", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
});

export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const savedEvents = mysqlTable("savedEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: varchar("eventId", { length: 255 }).notNull(),
  eventTitle: text("eventTitle"),
  eventDate: varchar("eventDate", { length: 100 }),
  eventCity: varchar("eventCity", { length: 100 }).notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedEvent = typeof savedEvents.$inferSelect;
export type InsertSavedEvent = typeof savedEvents.$inferInsert;

export const organizers = mysqlTable("organizers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  website: text("website"),
  description: text("description"),
  image: text("image"),
  verified: int("verified").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organizer = typeof organizers.$inferSelect;
export type InsertOrganizer = typeof organizers.$inferInsert;

export const events = mysqlTable("events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  image: text("image"),
  date: varchar("date", { length: 50 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  venue: text("venue").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  citySlug: varchar("citySlug", { length: 100 }).notNull().references(() => cities.slug),
  category: varchar("category", { length: 50 }).notNull().references(() => categories.id),
  price: varchar("price", { length: 50 }),
  interested: int("interested").default(0),
  tags: text("tags"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isFeatured: int("isFeatured").default(0),
  organizerId: int("organizerId").references(() => organizers.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  cities: text("cities"),
  categories: text("categories"),
  emailNotifications: int("emailNotifications").default(1),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "immediately"]).default("weekly"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventId: varchar("eventId", { length: 255 })
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(), // e.g. "CAD"
  total: double("total").notNull(), // total amount charged
  status: mysqlEnum("status", ["paid", "refunded", "pending"])
    .default("paid")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;
