import { FastifyInstance } from "fastify";
import { stripe, handlePaymentSuccess, handlePaymentFailure } from "../payments/stripe";

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
