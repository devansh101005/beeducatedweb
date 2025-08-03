const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiCall = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response is JSON before parsing
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Server returned non-JSON response (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return { data, status: res.status };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export { API_BASE };