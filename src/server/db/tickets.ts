import { desc, eq } from "drizzle-orm";
import { tickets, events as eventsTable, ticketTiers } from "./schema";
import { getDb } from "./client";

export async function getUserTickets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select({
    id: tickets.id,
    userId: tickets.userId,
    eventId: tickets.eventId,
    tierId: tickets.tierId,
    quantity: tickets.quantity,
    currency: tickets.currency,
    unitPrice: tickets.unitPrice,
    subtotal: tickets.subtotal,
    serviceFee: tickets.serviceFee,
    taxAmount: tickets.taxAmount,
    total: tickets.total,
    status: tickets.status,
    stripeSessionId: tickets.stripeSessionId,
    createdAt: tickets.createdAt,
    tierName: ticketTiers.name,
    event: {
      id: eventsTable.id,
      title: eventsTable.title,
      description: eventsTable.description,
      image: eventsTable.image,
      date: eventsTable.date,
      time: eventsTable.time,
      venue: eventsTable.venue,
      city: eventsTable.city,
      citySlug: eventsTable.citySlug,
      category: eventsTable.category,
      price: eventsTable.price,
      interested: eventsTable.interested,
      tags: eventsTable.tags,
      slug: eventsTable.slug,
      isFeatured: eventsTable.isFeatured,
      createdAt: eventsTable.createdAt,
      updatedAt: eventsTable.updatedAt,
    },
  })
  .from(tickets)
  .leftJoin(eventsTable, eq(tickets.eventId, eventsTable.id))
  .leftJoin(ticketTiers, eq(tickets.tierId, ticketTiers.id))
  .where(eq(tickets.userId, userId))
  .orderBy(desc(tickets.createdAt));
}