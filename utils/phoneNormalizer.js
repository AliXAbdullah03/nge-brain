/**
 * Phone number normalization utility
 * Normalizes phone numbers for consistent matching (removes spaces, dashes, parentheses)
 */

/**
 * Normalize phone number by removing spaces, dashes, parentheses, and other formatting
 * @param {string} phone - Phone number to normalize
 * @returns {string} - Normalized phone number
 */
const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  // Remove spaces, dashes, parentheses, and other common formatting characters
  return phone.replace(/[\s\-\(\)\.]/g, '');
};

/**
 * Compare two phone numbers (normalized)
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} - True if normalized phones match
 */
const comparePhones = (phone1, phone2) => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  return normalized1.toLowerCase() === normalized2.toLowerCase();
};

module.exports = {
  normalizePhone,
  comparePhones
};

