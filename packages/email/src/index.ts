import { render } from "@react-email/render";
import OrderConfirmedEmail, { type OrderConfirmedProps } from "./templates/order-confirmed";
import ShippingStatusEmail, { type ShippingStatusProps } from "./templates/shipping-status";

export type TemplateName = "order-confirmed" | "shipping-status";
export type TemplatePayloads = {
  "order-confirmed": OrderConfirmedProps;
  "shipping-status": ShippingStatusProps;
};

export function renderTemplate<T extends TemplateName>(name: T, payload: TemplatePayloads[T]) {
  if (name === "order-confirmed") {
    const orderPayload = payload as OrderConfirmedProps;
    const html = render(OrderConfirmedEmail(orderPayload));
    const subject = `Order #${orderPayload.orderNumber} confirmed`;
    const text = `Your order #${orderPayload.orderNumber} has been confirmed.`;
    return { subject, html, text };
  }
  if (name === "shipping-status") {
    const p = payload as ShippingStatusProps;
    const subjBy = {
      READY_TO_SHIP: "Ready to ship",
      LABEL_PURCHASED: "Label prepared",
      IN_TRANSIT: "In transit",
      DELIVERED: "Delivered",
    } as const;
    const subject = `Order #${p.orderNumber} — ${subjBy[p.status as keyof typeof subjBy]}`;
    const html = render(ShippingStatusEmail(p));
    const text = `Order #${p.orderNumber}: ${subjBy[p.status as keyof typeof subjBy]} — Track: ${p.trackingUrl}`;
    return { subject, html, text };
  }
  throw new Error(`Unknown template: ${name}`);
}
