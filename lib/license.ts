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
 * Returns expiry date based on plan name and duration
 */
export function getLicenseExpiry(planName: string): Date | null {
  // Extract duration from plan name (e.g., "Chamber (monthly)" -> "monthly")
  const durationMatch = planName.match(/\((monthly|quarterly|yearly)\)/i);
  
  if (!durationMatch) {
    // Default to monthly if no duration specified
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry;
  }

  const duration = durationMatch[1].toLowerCase();
  const expiry = new Date();

  switch (duration) {
    case 'monthly':
      expiry.setDate(expiry.getDate() + 30);
      break;
    case 'quarterly':
      expiry.setDate(expiry.getDate() + 90);
      break;
    case 'yearly':
      expiry.setDate(expiry.getDate() + 365);
      break;
    default:
      expiry.setDate(expiry.getDate() + 30);
  }

  return expiry;
}

