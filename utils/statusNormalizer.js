/**
 * Status normalization utility
 * Normalizes status values for consistent matching (case-insensitive, handles variations)
 */

/**
 * Normalize status value by removing case, spaces, underscores, and hyphens
 * @param {string} status - Status value to normalize
 * @returns {string} - Normalized status (lowercase, no special chars)
 */
const normalizeStatus = (status) => {
  if (!status || typeof status !== 'string') return '';
  return status.toLowerCase().replace(/[_\s-]/g, '');
};

/**
 * Map normalized status to database format
 * Database stores: pending, processing, confirmed, in_transit, out_for_delivery, delivered, completed, cancelled
 */
const STATUS_MAP = {
  'pending': 'pending',
  'processing': 'processing',
  'confirmed': 'confirmed',
  'intransit': 'in_transit',
  'outfordelivery': 'out_for_delivery',
  'delivered': 'delivered',
  'completed': 'completed',
  'cancelled': 'cancelled',
  'canceled': 'cancelled' // Handle US spelling
};

/**
 * Convert normalized status to database format
 * @param {string} normalizedStatus - Normalized status value
 * @returns {string|null} - Database status format or null if invalid
 */
const toDatabaseStatus = (normalizedStatus) => {
  return STATUS_MAP[normalizedStatus] || null;
};

/**
 * Parse and normalize comma-separated status values
 * @param {string} statusParam - Comma-separated status string (e.g., "out_for_delivery,in_transit")
 * @returns {string[]} - Array of normalized database status values
 */
const parseStatusFilter = (statusParam) => {
  if (!statusParam || typeof statusParam !== 'string') return [];
  
  const statusArray = statusParam
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const normalizedStatuses = statusArray
    .map(normalizeStatus)
    .map(toDatabaseStatus)
    .filter(s => s !== null); // Remove invalid statuses
  
  return normalizedStatuses;
};

/**
 * Check if a status value matches any of the provided filters (normalized comparison)
 * @param {string} dbStatus - Database status value
 * @param {string[]} filterStatuses - Array of normalized filter statuses
 * @returns {boolean} - True if matches
 */
const matchesStatusFilter = (dbStatus, filterStatuses) => {
  if (!filterStatuses || filterStatuses.length === 0) return true;
  const normalized = normalizeStatus(dbStatus);
  const dbFormat = toDatabaseStatus(normalized);
  return filterStatuses.includes(dbFormat);
};

module.exports = {
  normalizeStatus,
  toDatabaseStatus,
  parseStatusFilter,
  matchesStatusFilter,
  STATUS_MAP
};

