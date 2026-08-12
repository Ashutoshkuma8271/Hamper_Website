/**
 * Enterprise Cyber Security & Input Sanitization Engine
 * Protects against XSS, Injection Attacks, Data Tampering, and Malicious Payloads
 */

/**
 * Sanitizes raw string input against Cross-Site Scripting (XSS) and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validates a 10-digit Indian Mobile Number (6000000000 to 9999999999)
 */
export function validateIndianPhone(phone: string): { valid: boolean; cleanPhone: string; error?: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { valid: false, cleanPhone, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { valid: false, cleanPhone, error: 'Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.' };
  }
  return { valid: true, cleanPhone };
}

/**
 * Client-Side In-Memory Rate Limiting Guard
 * Prevents rapid automated form submission spam or brute-force attempts
 */
const submissionTracker = new Map<string, number>();

export function checkRateLimit(actionKey: string, cooldownMs = 2000): boolean {
  const lastTime = submissionTracker.get(actionKey) || 0;
  const now = Date.now();
  if (now - lastTime < cooldownMs) {
    return false; // Rate limit exceeded
  }
  submissionTracker.set(actionKey, now);
  return true;
}
