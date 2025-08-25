/**
 * Masks contact information in text to prevent direct communication
 * between clients and artists, maintaining platform mediation
 */

export function maskContacts(text: string): string {
  let maskedText = text;

  // Mask phone numbers
  if (process.env.MASK_BLOCK_PHONES === "true") {
    // International phone numbers
    maskedText = maskedText.replace(
      /(\+?[\d\s\-\(\)]{7,})/g,
      "[phone number removed]"
    );
    
    // Local phone numbers
    maskedText = maskedText.replace(
      /(\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b)/g,
      "[phone number removed]"
    );
  }

  // Mask email addresses
  if (process.env.MASK_BLOCK_EMAILS === "true") {
    maskedText = maskedText.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[email removed]"
    );
  }

  // Mask URLs
  if (process.env.MASK_BLOCK_URLS === "true") {
    // HTTP/HTTPS URLs
    maskedText = maskedText.replace(
      /https?:\/\/[^\s]+/g,
      "[url removed]"
    );
    
    // www URLs
    maskedText = maskedText.replace(
      /www\.[^\s]+/g,
      "[url removed]"
    );
  }

  return maskedText;
}

/**
 * Checks if text contains contact information
 */
export function containsContacts(text: string): boolean {
  const phoneRegex = /(\+?[\d\s\-\(\)]{7,})|(\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b)/;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;

  return phoneRegex.test(text) || emailRegex.test(text) || urlRegex.test(text);
}

/**
 * Logs contact detection for audit purposes
 */
export function logContactDetection(
  inquiryId: string,
  userId: string,
  originalText: string,
  maskedText: string
): void {
  if (originalText !== maskedText) {
    console.log(`[CONTACT_DETECTION] Inquiry: ${inquiryId}, User: ${userId}, Text modified`);
    // TODO: Add to audit log
  }
}
