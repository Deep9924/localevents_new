import { router, protectedProcedure, publicProcedure } from "../trpc";
import { getDb } from "@/server/db/client";
import { getUserTickets } from "@/server/db/tickets";
import { events, ticketTiers, tickets, taxRates } from "@/server/db/schema";
import { z } from "zod";
import Stripe from "stripe";
import { eq, and } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    })
  : null;

const DOMESTIC_PROCESSING_PERCENT_FEE = 0.05;
const INTERNATIONAL_PROCESSING_PERCENT_FEE = 0.06;
const PROCESSING_FIXED_FEE_CAD = 1.5;

const PROVINCE_CODES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;

const COUNTRY_CODES = ["CA", "US"] as const;

const checkoutLineItemSchema = z.object({
  tierId: z.number().nullable(),
  quantity: z.number().int().min(1).max(100),
});

export const ticketsRouter = router({
  getTaxRates: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db.select().from(taxRates).where(eq(taxRates.isActive, 1));
  }),

  getTaxRateByProvince: publicProcedure
    .input(
      z.object({
        provinceCode: z.enum(PROVINCE_CODES),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(taxRates)
        .where(
          and(
            eq(taxRates.provinceCode, input.provinceCode),
            eq(taxRates.isActive, 1)
          )
        )
        .limit(1);

      return result[0] ?? null;
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          filter: z.enum(["upcoming", "past", "all"]).default("all"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return getUserTickets(ctx.user.id, input?.filter ?? "all");
    }),

  getById: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      const ticket = result[0];
      if (!ticket || ticket.userId !== ctx.user.id) {
        throw new Error("Ticket not found or access denied");
      }

      return ticket;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userTickets = await getUserTickets(ctx.user.id, "all");

    return {
      total: userTickets.length,
      paid: userTickets.filter((t) => t.status === "paid").length,
      pending: userTickets.filter((t) => t.status === "pending").length,
      refunded: userTickets.filter((t) => t.status === "refunded").length,
      totalSpent: userTickets
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + Number(t.total), 0),
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z
        .object({
          eventId: z.string(),
          lineItems: z.array(checkoutLineItemSchema).min(1),
          billingProvince: z.enum(PROVINCE_CODES),
          firstName: z.string().min(1).max(100),
          lastName: z.string().min(1).max(100),
          email: z.string().email(),
          confirmEmail: z.string().email(),
          country: z.enum(COUNTRY_CODES),
        })
        .refine((data) => data.email === data.confirmEmail, {
          message: "Emails do not match",
          path: ["confirmEmail"],
        })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userEmail = input.email ?? ctx.user.email ?? undefined;

      if (!stripe) throw new Error("Stripe secret key not configured");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const eventResult = await db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);

      if (eventResult.length === 0) throw new Error("Event not found");
      const event = eventResult[0];

      const normalizedItems = input.lineItems.filter((item) => item.quantity > 0);
      if (normalizedItems.length === 0) {
        throw new Error("Please select at least one ticket.");
      }

      const taxRateResult = await db
        .select()
        .from(taxRates)
        .where(
          and(
            eq(taxRates.provinceCode, input.billingProvince),
            eq(taxRates.isActive, 1)
          )
        )
        .limit(1);

      const taxRate = taxRateResult[0];
      if (!taxRate) {
        throw new Error(
          `Tax rate not found for province: ${input.billingProvince}`
        );
      }

      const gstRate = Number(taxRate.gstRate);
      const pstRate = Number(taxRate.pstRate);
      const hstRate = Number(taxRate.hstRate);

      const isInternational = input.country.toUpperCase() !== "CA";
      const processingPercentFee = isInternational
        ? INTERNATIONAL_PROCESSING_PERCENT_FEE
        : DOMESTIC_PROCESSING_PERCENT_FEE;

      const pricedItems: Array<{
        tierId: number | null;
        quantity: number;
        tierName: string;
        unitPriceDollars: number;
        unitPriceCents: number;
        subtotalDollars: number;
        subtotalCents: number;
        tierRow: typeof ticketTiers.$inferSelect | null;
      }> = [];

      for (const item of normalizedItems) {
        if (item.tierId) {
          const tierResult = await db
            .select()
            .from(ticketTiers)
            .where(eq(ticketTiers.id, item.tierId))
            .limit(1);

          if (tierResult.length === 0) throw new Error("Ticket tier not found");
          const tier = tierResult[0];

          if (tier.eventId !== input.eventId) {
            throw new Error("Ticket tier does not belong to this event");
          }

          if (tier.isActive === 0) {
            throw new Error(`"${tier.name}" is no longer available`);
          }

          const sold = Number(tier.sold ?? 0);
          const quantityLimit = tier.quantity ? Number(tier.quantity) : null;

          if (quantityLimit !== null && sold >= quantityLimit) {
            throw new Error(`"${tier.name}" is sold out`);
          }

          if (quantityLimit !== null && sold + item.quantity > quantityLimit) {
            throw new Error(`Not enough "${tier.name}" tickets remaining`);
          }

          const unitPriceDollars = Number(tier.price);
          const subtotalDollars = unitPriceDollars * item.quantity;

          pricedItems.push({
            tierId: tier.id,
            quantity: item.quantity,
            tierName: tier.name,
            unitPriceDollars,
            unitPriceCents: Math.round(unitPriceDollars * 100),
            subtotalDollars,
            subtotalCents: Math.round(subtotalDollars * 100),
            tierRow: tier,
          });
        } else {
          let unitPriceDollars = 0;

          if (event.price !== "Free" && event.price !== null) {
            const parsed = parseFloat(
              String(event.price).replace(/[^d.]/g, "")
            );
            unitPriceDollars = isNaN(parsed) ? 0 : parsed;
          }

          const subtotalDollars = unitPriceDollars * item.quantity;

          pricedItems.push({
            tierId: null,
            quantity: item.quantity,
            tierName: "Standard Ticket",
            unitPriceDollars,
            unitPriceCents: Math.round(unitPriceDollars * 100),
            subtotalDollars,
            subtotalCents: Math.round(subtotalDollars * 100),
            tierRow: null,
          });
        }
      }

      const subtotalDollars = pricedItems.reduce(
        (sum, item) => sum + item.subtotalDollars,
        0
      );

      const processingFeeDollars =
        subtotalDollars > 0
          ? Math.round(
              (subtotalDollars * processingPercentFee +
                PROCESSING_FIXED_FEE_CAD) *
                100
            ) / 100
          : 0;

      const gstAmountDollars =
        Math.round(subtotalDollars * gstRate * 100) / 100;
      const pstAmountDollars =
        Math.round(subtotalDollars * pstRate * 100) / 100;
      const hstAmountDollars =
        Math.round(subtotalDollars * hstRate * 100) / 100;
      const totalTaxDollars =
        gstAmountDollars + pstAmountDollars + hstAmountDollars;
      const totalDollars =
        subtotalDollars + processingFeeDollars + totalTaxDollars;

      const processingFeeCents = Math.round(processingFeeDollars * 100);
      const gstAmountCents = Math.round(gstAmountDollars * 100);
      const pstAmountCents = Math.round(pstAmountDollars * 100);
      const hstAmountCents = Math.round(hstAmountDollars * 100);
      const totalTaxCents = Math.round(totalTaxDollars * 100);
      const totalCents = Math.round(totalDollars * 100);

      const allFree = pricedItems.every((item) => item.unitPriceCents === 0);

      const createdTicketIds: number[] = [];

      for (const item of pricedItems) {
        const itemShare =
          subtotalDollars > 0 ? item.subtotalDollars / subtotalDollars : 0;

        const itemProcessingFeeDollars = allFree
          ? 0
          : Math.round(processingFeeDollars * itemShare * 100) / 100;

        const itemTaxAmountDollars = allFree
          ? 0
          : Math.round(totalTaxDollars * itemShare * 100) / 100;

        const itemTotalDollars =
          item.subtotalDollars +
          itemProcessingFeeDollars +
          itemTaxAmountDollars;

        const inserted = await db.insert(tickets).values({
          userId,
          eventId: input.eventId,
          tierId: item.tierId,
          quantity: item.quantity,
          currency: "CAD",
          unitPrice: item.unitPriceDollars,
          subtotal: item.subtotalDollars,
          processingFee: itemProcessingFeeDollars,
          taxAmount: itemTaxAmountDollars,
          total: itemTotalDollars,
          status: allFree ? "paid" : "pending",
          stripeSessionId: null,
        });

type InsertResult = {
  insertId: number;
};

const ticketId = (inserted as unknown as InsertResult).insertId;
        
        if (!ticketId) {
          throw new Error("Failed to create ticket record");
        }

        createdTicketIds.push(Number(ticketId));
      }

      if (allFree) {
        for (const item of pricedItems) {
          if (item.tierId && item.tierRow) {
            await db
              .update(ticketTiers)
              .set({
                sold: Number(item.tierRow.sold ?? 0) + item.quantity,
              })
              .where(eq(ticketTiers.id, item.tierId));
          }
        }

        return {
          success: true,
          free: true,
          ticketIds: createdTicketIds,
        };
      }

      const stripeLineItems = pricedItems.map((item) => ({
        price_data: {
          currency: "cad" as const,
          product_data: {
            name: String(event.title),
            description: `${item.tierName} × ${item.quantity}`,
          },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.quantity,
      }));

      const processingFeeLabel = isInternational
        ? `Processing Fee (International card: ${(processingPercentFee * 100).toFixed(0)}% + $${PROCESSING_FIXED_FEE_CAD.toFixed(2)})`
        : `Processing Fee (${(processingPercentFee * 100).toFixed(0)}% + $${PROCESSING_FIXED_FEE_CAD.toFixed(2)})`;

      if (processingFeeCents > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "cad" as const,
            product_data: {
              name: processingFeeLabel,
              description: isInternational
                ? "Payment processing and platform costs for international cards"
                : "Payment processing and platform costs",
            },
            unit_amount: processingFeeCents,
          },
          quantity: 1,
        });
      }

      if (gstAmountCents > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "cad" as const,
            product_data: {
              name: `GST (${(gstRate * 100).toFixed(2)}%)`,
              description: "Goods and Services Tax",
            },
            unit_amount: gstAmountCents,
          },
          quantity: 1,
        });
      }

      if (pstAmountCents > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "cad" as const,
            product_data: {
              name: `PST (${(pstRate * 100).toFixed(2)}%)`,
              description: "Provincial Sales Tax",
            },
            unit_amount: pstAmountCents,
          },
          quantity: 1,
        });
      }

      if (hstAmountCents > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "cad" as const,
            product_data: {
              name: `HST (${(hstRate * 100).toFixed(2)}%)`,
              description: "Harmonized Sales Tax",
            },
            unit_amount: hstAmountCents,
          },
          quantity: 1,
        });
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: stripeLineItems,
        customer_email: userEmail,
        billing_address_collection: "required",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account/tickets?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${event.citySlug}/${event.slug}`,
        metadata: {
          ticketIds: createdTicketIds.join(","),
          userId: String(userId),
          eventId: input.eventId,
          billingProvince: input.billingProvince,
          country: input.country,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          subtotal: String(Math.round(subtotalDollars * 100)),
          processingFee: String(processingFeeCents),
          processingPercentFee: String(processingPercentFee),
          processingFixedFee: String(PROCESSING_FIXED_FEE_CAD),
          isInternational: String(isInternational),
          gstAmount: String(gstAmountCents),
          pstAmount: String(pstAmountCents),
          hstAmount: String(hstAmountCents),
          taxAmount: String(totalTaxCents),
          total: String(totalCents),
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams);

      for (const ticketId of createdTicketIds) {
        await db
          .update(tickets)
          .set({ stripeSessionId: session.id })
          .where(eq(tickets.id, ticketId));
      }

      return {
        success: true,
        free: false,
        url: session.url,
        ticketIds: createdTicketIds,
        breakdown: {
          subtotal: subtotalDollars,
          processingFee: processingFeeDollars,
          processingPercentFee,
          processingFixedFee: PROCESSING_FIXED_FEE_CAD,
          isInternational,
          gst: gstAmountDollars,
          pst: pstAmountDollars,
          hst: hstAmountDollars,
          tax: totalTaxDollars,
          total: totalDollars,
          provinceCode: input.billingProvince,
          provinceName: taxRate.provinceName,
        },
      };
    }),
});
