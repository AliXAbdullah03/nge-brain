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
 * Database stores the exact status strings:
 * - Shipment Received
 * - Shipment Processing
 * - Departed from Manila
 * - In Transit going to Dubai Airport
 * - Arrived at Dubai Airport
 * - Shipment Clearance
 * - Out for Delivery
 * - Delivered
 */
const STATUS_MAP = {
  'shipmentreceived': 'Shipment Received',
  'shipmentprocessing': 'Shipment Processing',
  'departedfrommanila': 'Departed from Manila',
  'intransitgoingtodubaiairport': 'In Transit going to Dubai Airport',
  'arrivedatdubaiairport': 'Arrived at Dubai Airport',
  'shipmentclearance': 'Shipment Clearance',
  'outfordelivery': 'Out for Delivery',
  'delivered': 'Delivered',
  // Legacy mappings for backward compatibility
  'pending': 'Shipment Received',
  'processing': 'Shipment Processing',
  'confirmed': 'Shipment Processing',
  'intransit': 'In Transit going to Dubai Airport',
  'completed': 'Delivered',
  'cancelled': 'Shipment Received',
  'canceled': 'Shipment Received'
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
 * Check if a status is valid according to the new status sequence
 * @param {string} status - Status value to validate
 * @returns {boolean} - True if valid
 */
const isValidStatus = (status) => {
  if (!status || typeof status !== 'string') return false;
  const normalized = normalizeStatus(status);
  return STATUS_MAP[normalized] !== undefined;
};

/**
 * Get the next valid status in the sequence
 * @param {string} currentStatus - Current status
 * @returns {string|null} - Next status or null if at end
 */
const getNextStatus = (currentStatus) => {
  const statusSequence = [
    'Shipment Received',
    'Shipment Processing',
    'Departed from Manila',
    'In Transit going to Dubai Airport',
    'Arrived at Dubai Airport',
    'Shipment Clearance',
    'Out for Delivery',
    'Delivered'
  ];
  
  const normalized = normalizeStatus(currentStatus);
  const dbStatus = toDatabaseStatus(normalized);
  if (!dbStatus) return null;
  
  const currentIndex = statusSequence.indexOf(dbStatus);
  if (currentIndex === -1 || currentIndex === statusSequence.length - 1) {
    return null;
  }
  
  return statusSequence[currentIndex + 1];
};

/**
 * Check if status transition is valid (can't skip steps)
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - True if transition is valid
 */
const isValidTransition = (fromStatus, toStatus) => {
  const statusSequence = [
    'Shipment Received',
    'Shipment Processing',
    'Departed from Manila',
    'In Transit going to Dubai Airport',
    'Arrived at Dubai Airport',
    'Shipment Clearance',
    'Out for Delivery',
    'Delivered'
  ];
  
  const normalizedFrom = normalizeStatus(fromStatus);
  const normalizedTo = normalizeStatus(toStatus);
  const dbFrom = toDatabaseStatus(normalizedFrom);
  const dbTo = toDatabaseStatus(normalizedTo);
  
  if (!dbFrom || !dbTo) return false;
  
  const fromIndex = statusSequence.indexOf(dbFrom);
  const toIndex = statusSequence.indexOf(dbTo);
  
  // Can only move forward in sequence, not backward
  return toIndex >= fromIndex;
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
  isValidStatus,
  getNextStatus,
  isValidTransition,
  STATUS_MAP
};

