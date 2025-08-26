import { prisma } from "@artfromromania/db";
import { enqueueEmail } from "@artfromromania/notifications";
// dacă ai deja helperul ăsta în web, copiază-l aici sau păstrează un util comun:
function trackingUrlFor(carrier: "DHL" | "SAMEDAY", code: string) {
  if (carrier === "DHL")
    return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(code)}`;
  return `https://www.sameday.ro/awb-tracking?code=${encodeURIComponent(code)}`;
}

// Dacă folosești @artfromromania/storage, ajustează importul:
import { storage } from "@artfromromania/storage";

type ShippingStatus = "READY_TO_SHIP" | "LABEL_PURCHASED" | "IN_TRANSIT" | "DELIVERED";

export async function sendShippingStatusEmail(shipmentId: string, status: ShippingStatus) {
  // 1) Load tot contextul necesar
  const sh = await prisma.shipment.findUniqueOrThrow({
    where: { id: shipmentId },
    include: {
      order: {
        include: {
          items: { 
            include: {
              artwork: { select: { title: true } }
            }
          },
          shippingAddress: true,
          buyer: { select: { id: true, email: true } },
        },
      },
    },
  });

  const addr = sh.order.shippingAddress;
  const dest = addr
    ? {
        name: [addr.firstName, addr.lastName].filter(Boolean).join(" ") || undefined,
        line1: addr.addressLine1 ?? undefined,
        city: addr.city ?? undefined,
        postal: addr.postalCode ?? undefined,
        country: addr.country ?? undefined,
      }
    : undefined;

  // 2) Carrier + tracking
  const tn = Array.isArray(sh.trackingNumbers) ? sh.trackingNumbers[0] : null as any;
  const carrier = (tn?.carrier ??
    (addr?.country === "RO" ? "SAMEDAY" : "DHL")) as "DHL" | "SAMEDAY";
  const trackingCode = tn?.code || "TBA";
  const trackingUrl = trackingUrlFor(carrier, trackingCode);

  // 3) Label PDF (opțional)
  let labelUrl: string | undefined;
  if (sh.labelStorageKey) {
    try {
      // Ajustează semnătura la clientul tău storage
      const signedUrl = await storage.getSignedUrl(sh.labelStorageKey, /*bucket*/ "private", Number(process.env.NOTIF_SIGNED_URL_TTL || 900));
      labelUrl = signedUrl.url;
    } catch {
      // ignora, nu blocăm emailul
    }
  }

  // 4) Items list (doar titlu + cantitate)
  const items = sh.order.items.map((i) => ({ 
    title: i.artwork?.title || `Item ${i.id}`, 
    qty: i.quantity 
  }));

  // 5) Order number fallback
  const orderNumber = sh.orderId;

  // 6) Trimite emailul (respectă preferințele userului automat prin enqueueEmail)
  await enqueueEmail({
    topic: "SHIPPING",
    template: "shipping-status",
    payload: {
      orderNumber,
      status,
      carrier,
      trackingCode,
      trackingUrl,
      labelUrl,
      items,
      destination: dest,
      // Poți calcula un ETA simplu dacă vrei (RO vs INTL); altfel lasă gol:
      // eta: "3–5 business days",
      supportEmail: process.env.EMAIL_REPLY_TO || "curator@artfromromania.com",
    },
    // preferăm userId (dacă există) pentru respectarea preferințelor,
    // dar trecem și email ca fallback
    userId: sh.order.buyer?.id,
    email: sh.order.buyer?.email || undefined,
  });
}
