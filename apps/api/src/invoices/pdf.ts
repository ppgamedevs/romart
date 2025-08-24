const PDFDocument = require("pdfkit");
import { format } from "date-fns";

interface InvoiceData {
  number: string;
  series: string;
  issuedAt: Date;
  currency: string;
  sellerName: string;
  sellerVatId?: string;
  sellerRegNo?: string;
  sellerAddress: {
    line1: string;
    city: string;
    postcode: string;
    country: string;
  };
  buyerName: string;
  buyerVatId?: string;
  buyerAddress: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    taxRate: number | null;
    taxAmount: number;
    totalAmount: number;
  }>;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  notes?: string;
}

export function renderInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      
      // Invoice details
      doc.fontSize(12).font('Helvetica');
      doc.text(`Invoice Number: ${invoice.number}`, { align: 'right' });
      doc.text(`Date: ${format(invoice.issuedAt, 'dd/MM/yyyy')}`, { align: 'right' });
      doc.moveDown(2);

      // Seller and Buyer information
      const sellerX = 50;
      const buyerX = 300;
      const startY = doc.y;

      // Seller
      doc.fontSize(14).font('Helvetica-Bold').text('SELLER', sellerX, startY);
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.sellerName, sellerX, startY + 25);
      if (invoice.sellerVatId) {
        doc.text(`VAT ID: ${invoice.sellerVatId}`, sellerX, startY + 40);
      }
      if (invoice.sellerRegNo) {
        doc.text(`Reg. No: ${invoice.sellerRegNo}`, sellerX, startY + 55);
      }
      doc.text(invoice.sellerAddress.line1, sellerX, startY + 70);
      doc.text(`${invoice.sellerAddress.city}, ${invoice.sellerAddress.postcode}`, sellerX, startY + 85);
      doc.text(invoice.sellerAddress.country, sellerX, startY + 100);

      // Buyer
      doc.fontSize(14).font('Helvetica-Bold').text('BUYER', buyerX, startY);
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.buyerName, buyerX, startY + 25);
      if (invoice.buyerVatId) {
        doc.text(`VAT ID: ${invoice.buyerVatId}`, buyerX, startY + 40);
      }
      doc.text(invoice.buyerAddress.line1, buyerX, startY + 55);
      if (invoice.buyerAddress.line2) {
        doc.text(invoice.buyerAddress.line2, buyerX, startY + 70);
      }
      const cityLine = `${invoice.buyerAddress.city}${invoice.buyerAddress.postalCode ? `, ${invoice.buyerAddress.postalCode}` : ''}`;
      doc.text(cityLine, buyerX, startY + (invoice.buyerAddress.line2 ? 85 : 70));
      doc.text(invoice.buyerAddress.country, buyerX, startY + (invoice.buyerAddress.line2 ? 100 : 85));

      doc.moveDown(3);

      // Items table
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 120;
      const quantityX = 350;
      const unitPriceX = 400;
      const taxRateX = 470;
      const taxAmountX = 520;
      const totalX = 570;

      // Table headers
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Item', itemCodeX, tableTop);
      doc.text('Description', descriptionX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Unit Price', unitPriceX, tableTop);
      doc.text('VAT %', taxRateX, tableTop);
      doc.text('VAT', taxAmountX, tableTop);
      doc.text('Total', totalX, tableTop);

      doc.moveDown(1);
      let currentY = doc.y;

      // Table rows
      doc.fontSize(9).font('Helvetica');
      invoice.items.forEach((item, index) => {
        const y = currentY + (index * 20);
        
        doc.text((index + 1).toString(), itemCodeX, y);
        doc.text(item.description, descriptionX, y);
        doc.text(item.quantity.toString(), quantityX, y);
        doc.text(formatCurrency(item.unitAmount, invoice.currency), unitPriceX, y);
        doc.text(item.taxRate ? `${(item.taxRate * 100).toFixed(0)}%` : '0%', taxRateX, y);
        doc.text(formatCurrency(item.taxAmount, invoice.currency), taxAmountX, y);
        doc.text(formatCurrency(item.totalAmount, invoice.currency), totalX, y);
      });

      const tableBottom = currentY + (invoice.items.length * 20) + 20;
      doc.moveDown(2);

      // Totals
      const totalsY = doc.y;
      const totalsX = 400;

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', totalsX, totalsY);
      doc.text(formatCurrency(invoice.subtotalAmount, invoice.currency), totalX, totalsY);

      if (invoice.shippingAmount > 0) {
        doc.text('Shipping:', totalsX, totalsY + 20);
        doc.text(formatCurrency(invoice.shippingAmount, invoice.currency), totalX, totalsY + 20);
      }

      if (invoice.taxAmount > 0) {
        doc.text('VAT:', totalsX, totalsY + 40);
        doc.text(formatCurrency(invoice.taxAmount, invoice.currency), totalX, totalsY + 40);
      }

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', totalsX, totalsY + 60);
      doc.text(formatCurrency(invoice.totalAmount, invoice.currency), totalX, totalsY + 60);

      // Notes
      if (invoice.notes) {
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica');
        doc.text('Notes:', 50, doc.y);
        doc.fontSize(9);
        doc.text(invoice.notes, 50, doc.y + 15, { width: 500 });
      }

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text('Thank you for your business!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function formatCurrency(amount: number, currency: string): string {
  const value = amount / 100; // Convert from minor units
  return `${value.toFixed(2)} ${currency}`;
}
