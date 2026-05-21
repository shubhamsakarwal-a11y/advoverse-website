import crypto from 'crypto';

/**
 * Generates a unique formatted license key
 * Format: ADV-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(): string {
  const hex = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `ADV-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

/**
 * Returns expiry date — null means lifetime
 */
export function getLicenseExpiry(planName: string): Date | null {
  if (planName === 'Lifetime License') return null;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 31); // 31-day month
  return expiry;
}
