/**
 * Unified API client for ecotrack backend
 * Handles both inventory and analytics endpoints through single backend
 */

const getBaseUrl = () => {
  // Vercel deployment URL or local development
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env) return env;
  
  // Fallback for development
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  return 'http://localhost:3000/api';
};

/**
 * Fetch wrapper for API calls
 * @param {string} endpoint - API endpoint (e.g., '/inventory/items', '/analytics/overview')
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function apiCall(endpoint, options = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // Response is not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get inventory API URL (for components that directly construct URLs)
 * @returns {string}
 */
export function getInventoryApiUrl() {
  return getBaseUrl();
}

/**
 * Get analytics API URL (for components that directly construct URLs)
 * @returns {string}
 */
export function getAnalyticsApiUrl() {
  return getBaseUrl();
}

export default {
  apiCall,
  getBaseUrl,
  getInventoryApiUrl,
  getAnalyticsApiUrl,
};
