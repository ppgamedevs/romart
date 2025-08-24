import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { format } from "date-fns";

export async function generateJobTicket(
  fulfillment: any,
  items: any[]
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  // Header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("RomArt Print Job Ticket", { align: "center" });

  doc.moveDown(0.5);

  // Job Info
  doc.fontSize(12).font("Helvetica");
  doc.text(`Job ID: ${fulfillment.id}`);
  doc.text(`Order ID: ${fulfillment.order.id}`);
  doc.text(`Date: ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
  doc.text(`Status: ${fulfillment.status}`);

  doc.moveDown();

  // Customer Info
  doc.fontSize(14).font("Helvetica-Bold").text("Customer Information");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Name: ${fulfillment.order.buyer.name}`);
  doc.text(`Email: ${fulfillment.order.buyer.email}`);

  if (fulfillment.order.shippingAddress) {
    const addr = fulfillment.order.shippingAddress;
    doc.text(`Address: ${addr.line1}`);
    if (addr.line2) doc.text(`         ${addr.line2}`);
    doc.text(`         ${addr.city}, ${addr.postalCode || ""}`);
    doc.text(`         ${addr.country}`);
  }

  doc.moveDown();

  // Print Items
  doc.fontSize(14).font("Helvetica-Bold").text("Print Items");
  doc.fontSize(10).font("Helvetica");

  for (const item of items) {
    const artwork = item.orderItem.artwork;
    const edition = item.orderItem.edition;
    const artist = artwork.artist;

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text(`${artwork.title} by ${artist.displayName}`);
    doc.font("Helvetica");
    doc.text(`Material: ${item.material}`);
    doc.text(`Size: ${item.widthCm}cm × ${item.heightCm}cm`);
    doc.text(`Quantity: ${item.quantity}`);
    doc.text(`Source Image: ${item.sourceImageKey || "Not specified"}`);

    // DPI calculation (simplified)
    const dpi = 300; // This would be calculated from actual image dimensions
    doc.text(`DPI: ${dpi}`);
  }

  doc.moveDown();

  // Print Specifications
  doc.fontSize(14).font("Helvetica-Bold").text("Print Specifications");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Bleed: ${process.env.POD_PRINT_BLEED_MM || 3}mm`);
  doc.text(`Min DPI: ${process.env.POD_PRINT_MIN_DPI || 150}`);
  doc.text(`Shipping Method: ${fulfillment.shippingMethod || "STANDARD"}`);

  doc.moveDown();

  // QR Code
  try {
    const qrData = JSON.stringify({
      fulfillmentId: fulfillment.id,
      orderId: fulfillment.order.id,
      timestamp: new Date().toISOString(),
    });

    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 100,
      margin: 1,
    });

    doc.image(qrBuffer, doc.page.width - 150, doc.y, {
      width: 100,
      height: 100,
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
  }

  doc.end();

  return Buffer.concat(chunks);
}

export async function generatePackingSlip(
  fulfillment: any,
  items: any[]
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  // Header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("RomArt Packing Slip", { align: "center" });

  doc.moveDown(0.5);

  // Order Info
  doc.fontSize(12).font("Helvetica");
  doc.text(`Order ID: ${fulfillment.order.id}`);
  doc.text(`Date: ${format(new Date(), "dd/MM/yyyy")}`);
  doc.text(`Fulfillment ID: ${fulfillment.id}`);

  doc.moveDown();

  // Customer Info
  doc.fontSize(14).font("Helvetica-Bold").text("Ship To:");
  doc.fontSize(10).font("Helvetica");
  doc.text(fulfillment.order.buyer.name);
  doc.text(fulfillment.order.buyer.email);

  if (fulfillment.order.shippingAddress) {
    const addr = fulfillment.order.shippingAddress;
    doc.text(addr.line1);
    if (addr.line2) doc.text(addr.line2);
    doc.text(`${addr.city}, ${addr.postalCode || ""}`);
    doc.text(addr.country);
  }

  doc.moveDown();

  // Items List
  doc.fontSize(14).font("Helvetica-Bold").text("Items:");
  doc.fontSize(10).font("Helvetica");

  for (const item of items) {
    const artwork = item.orderItem.artwork;
    const edition = item.orderItem.edition;
    const artist = artwork.artist;

    doc.moveDown(0.5);
    doc.text(`${item.quantity}x ${artwork.title} by ${artist.displayName}`);
    doc.text(`   Material: ${item.material}`);
    doc.text(`   Size: ${item.widthCm}cm × ${item.heightCm}cm`);
  }

  doc.moveDown();

  // Notes
  doc.fontSize(12).font("Helvetica-Bold").text("Notes:");
  doc.fontSize(10).font("Helvetica");
  doc.text("Please handle with care. These are fine art prints.");
  doc.text("If you notice any damage, please contact us immediately.");

  doc.moveDown();

  // Footer
  doc.fontSize(10).font("Helvetica");
  doc.text("Thank you for your purchase!", { align: "center" });
  doc.text("RomArt - ArtFromRomania.com", { align: "center" });

  doc.end();

  return Buffer.concat(chunks);
}
