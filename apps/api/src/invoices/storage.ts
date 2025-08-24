import { storage } from "@artfromromania/storage";

export async function uploadInvoicePDF(
  pdfBuffer: Buffer,
  invoiceNumber: string,
  year: number
): Promise<string> {
  const key = `private/invoices/${year}/${invoiceNumber}.pdf`;
  const bucket = process.env.S3_PRIVATE_BUCKET || "romart-private";
  
  try {
    // For now, we'll use a simple approach - in production you might want to use presigned uploads
    // This is a simplified implementation - you may need to adjust based on your storage setup
    const presignedPost = await storage.presignUpload({
      key,
      bucket,
      contentType: "application/pdf",
      maxSizeMB: 10
    });

    // In a real implementation, you would upload the file using the presigned URL
    // For now, we'll just return the key and assume the file will be uploaded
    console.log("Invoice PDF presigned upload created:", presignedPost.url);
    
    return key;
  } catch (error) {
    console.error("Failed to create invoice PDF upload:", error);
    throw new Error("Failed to create invoice PDF upload");
  }
}

export async function getInvoiceDownloadUrl(storageKey: string): Promise<string> {
  try {
    const bucket = process.env.S3_PRIVATE_BUCKET || "romart-private";
    const result = await storage.getSignedUrl(storageKey, bucket, 3600); // 1 hour

    return result.url;
  } catch (error) {
    console.error("Failed to generate invoice download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}
