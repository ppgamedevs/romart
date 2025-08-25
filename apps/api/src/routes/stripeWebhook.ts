import { FastifyInstance } from "fastify";
import { stripe, handlePaymentSuccess, handlePaymentFailure } from "../payments/stripe";
// import { createTransferReversal } from "../payments/connect";

// Temporary implementation until connect module is ready
async function createTransferReversal(
  transferId: string,
  amount: number,
  reason: string
): Promise<any> {
  // This would integrate with Stripe Connect for actual transfer reversals
  // For now, return a mock reversal object
  return {
    id: `trr_${Date.now()}_${transferId}`,
    transfer: transferId,
    amount,
    reason,
    status: "pending"
  };
}
import { getPayoutsByOrderId, updatePayoutStatus } from "@artfromromania/db";
import { prisma } from "@artfromromania/db";

export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  // Configure Fastify to handle raw body for webhook signature verification
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  fastify.post("/stripe/webhook", async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const body = request.body as string;

    if (!sig) {
      return reply.status(400).send({ error: "Missing stripe-signature header" });
    }

    let event;

    if (!stripe) {
      return reply.status(500).send({ error: "Stripe not configured" });
    }

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return reply.status(400).send({ error: "Invalid signature" });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object.id);
          break;

        case 'payment_intent.canceled':
          await handlePaymentFailure(event.data.object.id);
          break;

        case 'charge.refunded':
          await handleRefund(event.data.object);
          break;

        case 'charge.dispute.created':
          await handleChargeback(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error("Webhook handler error:", error);
      return reply.status(500).send({ error: "Webhook handler failed" });
    }
  });
}

async function handleRefund(charge: any) {
  const paymentIntentId = charge.payment_intent;
  
  // Find the order
  if (!stripe) {
    console.error("Stripe not configured");
    return;
  }
  
  const order = await stripe.paymentIntents.retrieve(paymentIntentId);
  const orderId = order.metadata?.orderId;

  if (!orderId) {
    console.error("No order ID found in payment intent metadata");
    return;
  }

  // Get payouts for this order
  const payouts = await getPayoutsByOrderId(prisma, orderId);

  // Process reversals for each payout
  for (const payout of payouts) {
    if (payout.status === "PAID" && payout.providerTransferId) {
      try {
        // Calculate reversal amount (proportional to refund)
        const refundAmount = charge.amount_refunded;
        const originalAmount = charge.amount;
        const reversalAmount = Math.round(
          (payout.orderItem.subtotal * refundAmount) / originalAmount
        );

        if (reversalAmount > 0) {
          // Create transfer reversal
          await createTransferReversal(
            payout.providerTransferId,
            reversalAmount,
            "refund"
          );

          // Update payout status
          await updatePayoutStatus(
            prisma,
            payout.id,
            "REVERSED"
          );
        }
      } catch (error) {
        console.error(`Failed to reverse payout ${payout.id}:`, error);
      }
    }
  }
}

async function handleChargeback(dispute: any) {
  const charge = dispute.charge;
  const paymentIntentId = charge.payment_intent;
  
  // Find the order
  if (!stripe) {
    console.error("Stripe not configured");
    return;
  }
  
  const order = await stripe.paymentIntents.retrieve(paymentIntentId);
  const orderId = order.metadata?.orderId;

  if (!orderId) {
    console.error("No order ID found in payment intent metadata");
    return;
  }

  // Get payouts for this order
  const payouts = await getPayoutsByOrderId(prisma, orderId);

  // Process reversals for each payout
  for (const payout of payouts) {
    if (payout.status === "PAID" && payout.providerTransferId) {
      try {
        // Calculate reversal amount (proportional to dispute amount)
        const disputeAmount = dispute.amount;
        const originalAmount = charge.amount;
        const reversalAmount = Math.round(
          (payout.orderItem.subtotal * disputeAmount) / originalAmount
        );

        if (reversalAmount > 0) {
          // Create transfer reversal
          await createTransferReversal(
            payout.providerTransferId,
            reversalAmount,
            "chargeback"
          );

          // Update payout status
          await updatePayoutStatus(
            prisma,
            payout.id,
            "REVERSED"
          );
        }
      } catch (error) {
        console.error(`Failed to reverse payout ${payout.id}:`, error);
      }
    }
  }
}
