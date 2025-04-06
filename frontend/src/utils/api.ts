// Base URL for API calls
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://eventmosaic.net'  // Production URL (using HTTP)
  : 'http://localhost:3000';    // Development URL

// Function to build complete API URLs
export const buildPath = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}/${cleanPath}`;
};

// Common API routes
export const API_ROUTES = {
    LOGIN: 'api/auth/login',
    REGISTER: 'api/auth/register',
    EVENTS: 'api/events',
    EVENT: (id: string) => `api/events/${id}`,
    FORGOT_PASSWORD: 'api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    INSTAGRAM_ACCOUNTS: 'api/instagram/accounts',
    UPDATE_FOLLOWED_ACCOUNTS: 'api/auth/update-followed-accounts'
}; 