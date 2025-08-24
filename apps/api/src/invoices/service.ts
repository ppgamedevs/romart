import { prisma } from "@artfromromania/db";
import { renderInvoicePDF } from "./pdf";
import { uploadInvoicePDF } from "./storage";

export async function generateInvoiceForOrder(orderId: string): Promise<string> {
  // Get order with all related data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          artwork: true,
          edition: true
        }
      },
      shippingAddress: true,
      billingAddress: true,
      buyer: true
    }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Get or create invoice counter
  const year = new Date().getFullYear();
  const series = process.env.INVOICE_SERIES || "RO-AFR";
  
  const counter = await prisma.invoiceCounter.upsert({
    where: {
      series_year: {
        series,
        year
      }
    },
    update: {
      nextNo: {
        increment: 1
      }
    },
    create: {
      series,
      year,
      nextNo: parseInt(process.env.INVOICE_START_NUMBER || "1")
    }
  });

  // Generate invoice number
  const invoiceNumber = process.env.INVOICE_YEAR_PREFIX === "true" 
    ? `${series}/${year}/${counter.nextNo.toString().padStart(6, '0')}`
    : `${series}/${counter.nextNo.toString().padStart(6, '0')}`;

  // Prepare invoice data
  const invoiceData = {
    number: invoiceNumber,
    series,
    issuedAt: new Date(),
    currency: order.currency,
    sellerName: process.env.SELLER_NAME || "OnlyTips SRL",
    sellerVatId: process.env.SELLER_VAT_ID,
    sellerRegNo: process.env.SELLER_REG_NO,
    sellerAddress: {
      line1: process.env.SELLER_ADDRESS_LINE1 || "Str. Ceahlaul 16",
      city: process.env.SELLER_ADDRESS_CITY || "București",
      postcode: process.env.SELLER_ADDRESS_POSTCODE || "060379",
      country: process.env.SELLER_ADDRESS_COUNTRY || "RO"
    },
    buyerName: order.buyer.name || order.buyer.email || "Unknown Buyer",
    buyerVatId: order.billingAddress?.vatId || undefined,
          buyerAddress: {
        line1: order.billingAddress?.addressLine1 || "",
        line2: order.billingAddress?.addressLine2 || undefined,
        city: order.billingAddress?.city || "",
        region: order.billingAddress?.region || undefined,
        postalCode: order.billingAddress?.postalCode || undefined,
        country: order.billingAddress?.country || ""
      },
    items: order.items.map(item => {
      let description = "";
      if (item.kind === "ORIGINAL") {
        description = `Original artwork: ${item.artwork?.title || "Unknown"}`;
      } else if (item.kind === "PRINT") {
        description = `Print edition: ${item.artwork?.title || "Unknown"} (${item.edition?.type || "PRINT"})`;
      } else if (item.kind === "DIGITAL") {
        description = `Digital edition: ${item.artwork?.title || "Unknown"} (${item.edition?.type || "DIGITAL"})`;
      }

      return {
        description,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        taxRate: null, // Will be calculated from tax lines
        taxAmount: 0, // Will be calculated from tax lines
        totalAmount: item.subtotal
      };
    }),
    subtotalAmount: order.subtotalAmount,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    totalAmount: order.totalAmount,
    notes: order.taxAmount === 0 ? "VAT reverse charge under Article 196 of Directive 2006/112/EC" : undefined
  };

  // Generate PDF
  const pdfBuffer = await renderInvoicePDF(invoiceData);

  // Upload to storage
  const storageKey = await uploadInvoicePDF(pdfBuffer, invoiceNumber, year);

  // Create invoice record
  const invoice = await prisma.invoice.create({
    data: {
      orderId: order.id,
      number: invoiceNumber,
      series,
      issuedAt: invoiceData.issuedAt,
      currency: order.currency,
      sellerName: invoiceData.sellerName,
      sellerVatId: invoiceData.sellerVatId,
      sellerRegNo: invoiceData.sellerRegNo,
      sellerAddress: invoiceData.sellerAddress,
      buyerName: invoiceData.buyerName,
      buyerVatId: invoiceData.buyerVatId,
      buyerAddress: invoiceData.buyerAddress,
      subtotalAmount: order.subtotalAmount,
      taxAmount: order.taxAmount,
      shippingAmount: order.shippingAmount,
      totalAmount: order.totalAmount,
      notes: invoiceData.notes,
      pdfStorageKey: storageKey,
      items: {
        create: invoiceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount
        }))
      }
    }
  });

  return invoice.id;
}
