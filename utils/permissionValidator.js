/**
 * Permission validation utility
 */

// Canonical permission list used by frontend/backend
const VALID_PERMISSIONS = new Set([
  'order:create',
  'order:modify',
  'order:delete',
  'order:view',
  'shipment:status_update',
  'shipment:bulk_update',
  'shipment:view',
  'user:create',
  'user:modify',
  'user:delete',
  'user:view',
  'frontend:edit',
  'frontend:reviews',
  'settings:modify'
]);

/**
 * Validate permission string format
 * @param {string} permission - Permission string (e.g., "order:create")
 * @returns {boolean} - True if valid
 */
const isValidPermission = (permission) => {
  if (typeof permission !== 'string') return false;
  return VALID_PERMISSIONS.has(permission);
};

/**
 * Validate array of permissions
 * @param {string[]} permissions - Array of permission strings
 * @returns {{ valid: boolean, invalid: string[] }} - Validation result
 */
const validatePermissions = (permissions) => {
  if (!Array.isArray(permissions)) {
    return { valid: false, invalid: ['Permissions must be an array'] };
  }
  
  const invalid = permissions.filter(p => !isValidPermission(p));
  
  return {
    valid: invalid.length === 0,
    invalid
  };
};

module.exports = {
  isValidPermission,
  validatePermissions,
  VALID_PERMISSIONS
};

