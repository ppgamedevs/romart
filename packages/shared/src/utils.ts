/**
 * Utility functions for the shared package
 */

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * Format price from minor units (cents) to display format
 */
export function formatPrice(amount: number, currency: string = "EUR"): string {
  const majorUnits = amount / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(majorUnits)
}

/**
 * Convert display price to minor units (cents)
 */
export function parsePrice(price: string): number {
  const cleanPrice = price.replace(/[^\d.,]/g, '')
  const majorUnits = parseFloat(cleanPrice.replace(',', '.'))
  return Math.round(majorUnits * 100)
}

/**
 * Format dimensions for display
 */
export function formatDimensions(width?: number, height?: number, depth?: number): string {
  const parts: string[] = []
  
  if (width) parts.push(`${width}cm`)
  if (height) parts.push(`${height}cm`)
  if (depth) parts.push(`${depth}cm`)
  
  return parts.join(' × ') || 'Dimensions not specified'
}

/**
 * Convert cm to inches for display
 */
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
