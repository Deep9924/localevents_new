import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
  tags: text('tags'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  isFeatured: int('isFeatured').default(0),
  organizerId: int('organizerId').references(() => organizers.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ── Ticket Tiers ───────────────────────────────────────────────────────────
export const ticketTiers = mysqlTable('ticketTiers', {
  id: int('id').autoincrement().primaryKey(),
  eventId: varchar('eventId', { length: 255 }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),       // e.g. "General Admission", "VIP"
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  quantity: int('quantity'),                               // null = unlimited
  sold: int('sold').default(0),
  isActive: int('isActive').default(1),
  sortOrder: int('sortOrder').default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type TicketTier = typeof ticketTiers.$inferSelect;
export type InsertTicketTier = typeof ticketTiers.$inferInsert;

// ── Tickets (purchased) ────────────────────────────────────────────────────
export const tickets = mysqlTable('tickets', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: varchar('eventId', { length: 255 }).notNull().references(() => events.id),
  tierId: int('tierId').references(() => ticketTiers.id),
  quantity: int('quantity').notNull().default(1),
  currency: varchar('currency', { length: 10 }).default('CAD'),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).default('0'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0'),
  serviceFee: decimal('serviceFee', { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal('taxAmount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).default('0'),
  stripeSessionId: varchar('stripeSessionId', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'paid', 'refunded', 'cancelled']).default('pending').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

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

export const notificationPreferences = mysqlTable('notificationPreferences', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cities: text('cities'),
  categories: text('categories'),
  emailNotifications: int('emailNotifications').default(1),
  frequency: mysqlEnum('frequency', ['daily', 'weekly', 'immediately']).default('weekly'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;