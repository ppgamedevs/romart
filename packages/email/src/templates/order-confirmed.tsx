import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Link } from "@react-email/components";

type LineItem = { title: string; qty: number; amountMinor: number; currency: string };
export type OrderConfirmedProps = {
  orderNumber: string;
  customerName?: string;
  currency: string; // "EUR" | "RON" | "USD"
  totalMinor: number;
  items: LineItem[];
  orderUrl: string;
  supportEmail: string;
};

const fmt = (n: number, ccy: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy }).format(n / 100);

export default function OrderConfirmedEmail(props: OrderConfirmedProps) {
  const { orderNumber, customerName = "Collector", currency, totalMinor, items, orderUrl, supportEmail } = props;
  return (
    <Html>
      <Head />
      <Preview>Order #{orderNumber} confirmed — thank you!</Preview>
      <Body style={{ backgroundColor: "#ffffff", color: "#111827", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px" }}>
          <Heading as="h2" style={{ margin: "0 0 8px 0" }}>
            Thank you{customerName ? `, ${customerName}` : ""}! 🎉
          </Heading>
          <Text style={{ margin: "0 0 16px 0" }}>Your order <b>#{orderNumber}</b> has been confirmed.</Text>

          <Section style={{ margin: "16px 0", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <Heading as="h3" style={{ fontSize: 16, margin: "0 0 8px 0" }}>Items</Heading>
            {items.map((it, idx) => (
              <Text key={idx} style={{ margin: "4px 0" }}>
                {it.title} × {it.qty} — {fmt(it.amountMinor * it.qty, it.currency || currency)}
              </Text>
            ))}
            <Hr />
            <Text><b>Total:</b> {fmt(totalMinor, currency)}</Text>
          </Section>

          <Section style={{ margin: "16px 0" }}>
            <Link href={orderUrl} style={{ display: "inline-block", background: "#111827", color: "#fff", padding: "10px 16px", borderRadius: 6, textDecoration: "none" }}>
              View your order
            </Link>
          </Section>

          <Text style={{ fontSize: 12, color: "#6b7280" }}>
            Need help? Email us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
