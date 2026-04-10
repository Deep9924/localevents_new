import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb } from "@/server/db/index";
import { tickets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketId = session.metadata?.ticketId;
      if (ticketId) {
        await db
          .update(tickets)
          .set({
            status: "paid",
            stripeSessionId: session.id,
          })
          .where(eq(tickets.id, Number(ticketId)));
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ticketId = session.metadata?.ticketId;
      if (ticketId) {
        await db
          .update(tickets)
          .set({ status: "pending" })
          .where(eq(tickets.id, Number(ticketId)));
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const sessionId = charge.payment_intent as string;
      if (sessionId) {
        await db
          .update(tickets)
          .set({ status: "refunded" })
          .where(eq(tickets.stripeSessionId, sessionId));
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
