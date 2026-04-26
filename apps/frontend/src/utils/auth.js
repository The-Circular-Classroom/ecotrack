// apps/frontend/src/utils/auth.js

export function safeParseJwt(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeGroups(groups) {
  if (!groups) return [];
  const arr = Array.isArray(groups) ? groups : [String(groups)];
  return arr.map((g) => {
    if (g === 'Schoolstaff') return 'SchoolStaff';
    if (g === 'TCCAdminstrators') return 'TCCAdministrators';
    return g;
  });
}

/**
 * Read Cognito groups from an access token (passed in), or from sessionStorage.
 */
export function getCognitoGroupsFromAccessToken(accessToken) {
  const token = accessToken || sessionStorage.getItem('accessToken');
  const payload = safeParseJwt(token);
  return normalizeGroups(payload?.['cognito:groups']);
}

/**
 * Map Cognito groups to a UI role constant.
 */
export function getUserRoleFromGroups(groups) {
  const g = normalizeGroups(groups);

  if (g.includes('TCCAdministrators')) return 'TCC_ADMIN';
  if (g.includes('SchoolStaff')) return 'SCHOOL_STAFF';
  if (g.includes('ParentSupportGroup')) return 'PSG';

  return 'UNKNOWN';
}

/**
 * Get the default app landing route for a UI role.
 */
export function getDefaultRouteForRole(role) {
  switch (role) {
    case 'TCC_ADMIN':
      return '/analytics/overview';
    case 'SCHOOL_STAFF':
    case 'PSG':
      return '/analytics/school';
    default:
      return '/inventory';
  }
}

/**
 * Persist role in sessionStorage.
 */
export function setRoleInSession(role) {
  try {
    sessionStorage.setItem('userRole', role);
  } catch {
    // ignore
  }
}

/**
 * Read role from sessionStorage if present, otherwise decode from token.
 */
export function getRoleFromSession() {
  try {
    const stored = sessionStorage.getItem('userRole');
    if (stored) return stored;

    const groups = getCognitoGroupsFromAccessToken();
    const role = getUserRoleFromGroups(groups);
    sessionStorage.setItem('userRole', role);
    return role;
  } catch {
    return 'UNKNOWN';
  }
}
