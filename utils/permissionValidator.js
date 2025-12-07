/**
 * Permission validation utility
 */

const VALID_RESOURCES = ['order', 'shipment', 'user', 'frontend', 'settings'];
const VALID_ACTIONS = [
  'create', 'modify', 'delete', 'view', 
  'status_update', 'bulk_update', 'edit', 
  'reviews', 'modify'
];

/**
 * Validate permission string format
 * @param {string} permission - Permission string (e.g., "order:create")
 * @returns {boolean} - True if valid
 */
const isValidPermission = (permission) => {
  if (typeof permission !== 'string') return false;
  
  const parts = permission.split(':');
  if (parts.length !== 2) return false;
  
  const [resource, action] = parts;
  return VALID_RESOURCES.includes(resource) && VALID_ACTIONS.includes(action);
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
  VALID_RESOURCES,
  VALID_ACTIONS
};

