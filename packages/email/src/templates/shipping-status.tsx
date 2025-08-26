import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Link } from "@react-email/components";

export type ShippingStatus =
  | "READY_TO_SHIP"
  | "LABEL_PURCHASED"
  | "IN_TRANSIT"
  | "DELIVERED";

type Item = { title: string; qty: number };

export type ShippingStatusProps = {
  orderNumber: string;
  status: ShippingStatus;
  carrier: "DHL" | "SAMEDAY";
  trackingCode: string;
  trackingUrl: string;         // construit în API, nu în template
  labelUrl?: string;           // (optional) signed URL la PDF etichetă
  items: Item[];
  destination?: {
    name?: string;
    line1?: string;
    city?: string;
    postal?: string;
    country?: string;
  };
  eta?: string;                // ex: "2025-09-03" sau "3–5 business days"
  supportEmail: string;
};

function statusTitle(s: ShippingStatus) {
  switch (s) {
    case "READY_TO_SHIP": return "Your order is getting ready to ship";
    case "LABEL_PURCHASED": return "Shipping label prepared";
    case "IN_TRANSIT": return "Your order is on its way";
    case "DELIVERED": return "Delivered — enjoy your art!";
  }
}

export default function ShippingStatusEmail(props: ShippingStatusProps) {
  const { orderNumber, status, carrier, trackingCode, trackingUrl, labelUrl, items, destination, eta, supportEmail } = props;
  const title = statusTitle(status);

  return (
    <Html>
      <Head />
      <Preview>{title} — Order #{orderNumber}</Preview>
      <Body style={{ backgroundColor: "#ffffff", color: "#111827", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px" }}>
          <Heading as="h2" style={{ margin: "0 0 8px 0" }}>{title}</Heading>
          <Text style={{ margin: "0 0 16px 0" }}>Order <b>#{orderNumber}</b></Text>

          <Section style={{ margin: "12px 0", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <Text style={{ margin: 0 }}><b>Carrier:</b> {carrier}</Text>
            <Text style={{ margin: 0 }}><b>Tracking code:</b> {trackingCode}</Text>
            {eta && <Text style={{ margin: "6px 0 0 0" }}><b>ETA:</b> {eta}</Text>}
            <Section style={{ marginTop: 12 }}>
              <Link href={trackingUrl} style={{ display: "inline-block", background: "#111827", color: "#fff", padding: "10px 16px", borderRadius: 6, textDecoration: "none" }}>
                Track shipment
              </Link>
              {labelUrl && (
                <Text style={{ marginTop: 8 }}>
                  Or download the label: <a href={labelUrl}>PDF</a>
                </Text>
              )}
            </Section>
          </Section>

          {destination && (
            <Section style={{ margin: "12px 0", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
              <Heading as="h3" style={{ fontSize: 16, margin: "0 0 8px 0" }}>Destination</Heading>
              <Text style={{ margin: 0 }}>{destination.name}</Text>
              <Text style={{ margin: 0 }}>{destination.line1}</Text>
              <Text style={{ margin: 0 }}>{destination.postal} {destination.city}</Text>
              <Text style={{ margin: 0 }}>{destination.country}</Text>
            </Section>
          )}

          <Section style={{ margin: "12px 0", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <Heading as="h3" style={{ fontSize: 16, margin: "0 0 8px 0" }}>Items</Heading>
            {items.map((it, idx) => (
              <Text key={idx} style={{ margin: "4px 0" }}>{it.title} × {it.qty}</Text>
            ))}
          </Section>

          <Hr />
          <Text style={{ fontSize: 12, color: "#6b7280" }}>
            Need help? Email us at <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
