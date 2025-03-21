const APP_NAME = 'eventmosaic.net';
//const API_PORT = '3000';

export function buildPath(route: string): string {
    // Remove leading slash if present
    const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
    
    if (process.env.NODE_ENV === 'production') {
        return `http://${APP_NAME}:3000/${cleanRoute}`;
    } else {
        return `http://localhost:3000/${cleanRoute}`;
    }
}

// Common API routes
export const API_ROUTES = {
    LOGIN: 'api/auth/login',
    REGISTER: 'api/auth/register',
    EVENTS: 'api/events',
    EVENT: (id: string) => `api/events/${id}`
}; 