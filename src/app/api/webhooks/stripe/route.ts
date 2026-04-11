import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/server/db/client";
import { tickets, ticketTiers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 }
    );
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Stripe webhook signature failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature", details: err.message },
      { status: 400 }
    );
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketIdsRaw = session.metadata?.ticketIds ?? "";
      const ticketIds = ticketIdsRaw
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id) && id > 0);

      for (const ticketId of ticketIds) {
        const ticketRows = await db
          .select()
          .from(tickets)
          .where(eq(tickets.id, ticketId))
          .limit(1);

        const ticket = ticketRows[0];
        if (!ticket) continue;

        await db
          .update(tickets)
          .set({
            status: "paid",
            stripeSessionId: session.id,
          })
          .where(eq(tickets.id, ticketId));

        if (ticket.tierId) {
          const tierRows = await db
            .select()
            .from(ticketTiers)
            .where(eq(ticketTiers.id, Number(ticket.tierId)))
            .limit(1);

          const tier = tierRows[0];
          if (tier) {
            await db
              .update(ticketTiers)
              .set({
                sold: Number(tier.sold ?? 0) + Number(ticket.quantity ?? 0),
              })
              .where(eq(ticketTiers.id, Number(ticket.tierId)));
          }
        }
      }

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketIdsRaw = session.metadata?.ticketIds ?? "";
      const ticketIds = ticketIdsRaw
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isFinite(id) && id > 0);

      for (const ticketId of ticketIds) {
        await db
          .update(tickets)
          .set({ status: "pending" })
          .where(eq(tickets.id, ticketId));
      }

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}