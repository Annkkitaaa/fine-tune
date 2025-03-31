// Development configuration to bypass authentication
const isDevelopment = 
  import.meta.env.DEV || 
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const DEV_CONFIG = {
  // Set to true to bypass all authentication (auto-enabled in development)
  BYPASS_AUTH: isDevelopment,
  
  // Mock user data for development
  MOCK_USER: {
    id: 1,
    email: 'dev@example.com',
    full_name: 'Development User',
    is_active: true,
    is_superuser: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // Mock token for API requests
  MOCK_TOKEN: 'mock-dev-token-for-development-only'
};