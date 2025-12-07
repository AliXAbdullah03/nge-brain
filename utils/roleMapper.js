/**
 * Role name mapping utility
 * Maps old role names to new standardized names
 */
const ROLE_NAME_MAP = {
  'Staff': 'Hub Receiver',
  'Manager': 'Admin',
  'staff': 'Hub Receiver',
  'manager': 'Admin',
  'Staff Member': 'Hub Receiver',
  'Manager Role': 'Admin'
};

/**
 * Map role name to standardized name
 * @param {string} roleName - Role name to map
 * @returns {string} - Standardized role name
 */
const mapRoleName = (roleName) => {
  if (!roleName) return roleName;
  return ROLE_NAME_MAP[roleName] || roleName;
};

/**
 * Validate if role name is valid
 * @param {string} roleName - Role name to validate
 * @returns {boolean} - True if valid
 */
const isValidRoleName = (roleName) => {
  const validRoles = ['Driver', 'Super Admin', 'Admin', 'Hub Receiver'];
  return validRoles.includes(roleName);
};

/**
 * Get standardized role name
 * @param {string} roleName - Role name (may be old format)
 * @returns {string} - Standardized role name
 */
const getStandardizedRoleName = (roleName) => {
  const mapped = mapRoleName(roleName);
  return isValidRoleName(mapped) ? mapped : roleName;
};

module.exports = {
  mapRoleName,
  isValidRoleName,
  getStandardizedRoleName,
  ROLE_NAME_MAP
};

