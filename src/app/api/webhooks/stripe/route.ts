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

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
  }

  switch (event.type) {

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { ticketId, tierId, quantity } = session.metadata ?? {};

      if (ticketId) {
        await db
          .update(tickets)
          .set({ status: "paid", stripeSessionId: session.id })
          .where(eq(tickets.id, Number(ticketId)));

        if (tierId && tierId !== "" && quantity) {
          const tierRows = await db
            .select()
            .from(ticketTiers)
            .where(eq(ticketTiers.id, Number(tierId)))
            .limit(1);

          const tier = tierRows[0];
          if (tier) {
            await db
              .update(ticketTiers)
              .set({ sold: Number(tier.sold ?? 0) + Number(quantity) })
              .where(eq(ticketTiers.id, Number(tierId)));
          }
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { ticketId } = session.metadata ?? {};

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
      const sessionId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

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
