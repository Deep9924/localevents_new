import { getDb } from "./client";
import { tickets, events } from "./schema";
import { eq, desc } from "drizzle-orm";

export type TicketFilter = "upcoming" | "past" | "all";

function parseEventDate(dateStr: string, timeStr?: string): Date {
  if (!dateStr) return new Date("2099-01-01T12:00:00");

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(`${dateStr}T${timeStr || "12:00"}:00`);
    if (!isNaN(d.getTime())) return d;
  }

  const currentYear = new Date().getFullYear();
  const normalized = /\d{4}/.test(dateStr) ? dateStr : `${dateStr}, ${currentYear}`;
  const d = new Date(`${normalized} ${timeStr || "12:00"}`);
  if (!isNaN(d.getTime())) return d;

  return new Date("2099-01-01T12:00:00");
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function getUserTickets(
  userId: number,
  filter: TicketFilter = "all"
) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: tickets.id,
      userId: tickets.userId,
      eventId: tickets.eventId,
      tierId: tickets.tierId,
      quantity: tickets.quantity,
      currency: tickets.currency,
      unitPrice: tickets.unitPrice,
      subtotal: tickets.subtotal,
      processingFee: tickets.processingFee,
      taxAmount: tickets.taxAmount,
      total: tickets.total,
      status: tickets.status,
      stripeSessionId: tickets.stripeSessionId,
      createdAt: tickets.createdAt,
      event: {
        id: events.id,
        title: events.title,
        description: events.description,
        image: events.image,
        date: events.date,
        time: events.time,
        venue: events.venue,
        city: events.city,
        citySlug: events.citySlug,
        category: events.category,
        price: events.price,
        slug: events.slug,
        interested: events.interested,
        tags: events.tags,
        isFeatured: events.isFeatured,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      },
    })
    .from(tickets)
    .leftJoin(events, eq(tickets.eventId, events.id))
    .where(eq(tickets.userId, userId))
    .orderBy(desc(tickets.createdAt));

  const validRows = rows.filter(
    (ticket) =>
      ticket.event !== null &&
      (ticket.status === "paid" ||
        ticket.status === "pending" ||
        ticket.status === "refunded")
  );

  if (filter === "all") return validRows;

  const today = startOfDay(new Date());

  if (filter === "upcoming") {
    return validRows
      .filter((ticket) => {
        const eventDate = startOfDay(
          parseEventDate(ticket.event.date, ticket.event.time ?? undefined)
        );
        return eventDate.getTime() >= today.getTime();
      })
      .sort(
        (a, b) =>
          parseEventDate(a.event.date, a.event.time ?? undefined).getTime() -
          parseEventDate(b.event.date, b.event.time ?? undefined).getTime()
      );
  }

  return validRows
    .filter((ticket) => {
      const eventDate = startOfDay(
        parseEventDate(ticket.event.date, ticket.event.time ?? undefined)
      );
      return eventDate.getTime() < today.getTime();
    })
    .sort(
      (a, b) =>
        parseEventDate(b.event.date, b.event.time ?? undefined).getTime() -
        parseEventDate(a.event.date, a.event.time ?? undefined).getTime()
    );
}