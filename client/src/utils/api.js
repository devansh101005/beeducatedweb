/**
 * Get the API base URL based on environment
 * For production (when VITE_API_BASE_URL is not set or empty), use relative URLs
 * For development, use localhost
 */
export const getApiUrl = (endpoint) => {
  const envVar = import.meta.env.VITE_API_BASE_URL;
  
  // If environment variable is not set, empty, or contains placeholder values
  if (!envVar || envVar === "" || envVar === "null" || envVar === "undefined" || envVar === '""') {
    // In production (Vercel), use relative URLs that get proxied
    // In development, fallback to localhost
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment ? "http://localhost:5000" : "";
    return `${baseUrl}${endpoint}`;
  }
  
  // Use the provided environment variable
  return `${envVar}${endpoint}`;
};