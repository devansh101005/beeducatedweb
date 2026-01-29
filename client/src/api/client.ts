// API client configuration with Clerk authentication
// Updated to automatically inject Clerk JWT token

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v2';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean; // For public endpoints that don't need auth
}

// Token getter function - will be set by ClerkProvider
let getAuthToken: (() => Promise<string | null>) | null = null;

/**
 * Set the auth token getter function
 * This should be called once when the app initializes with Clerk
 */
export const setAuthTokenGetter = (getter: () => Promise<string | null>): void => {
  getAuthToken = getter;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, skipAuth, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // Get auth token if available and not skipped
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (!skipAuth && getAuthToken) {
      try {
        const token = await getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'API request failed');
    }

    // Handle empty responses (204 No Content)
    const contentType = response.headers.get('content-type');
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>, skipAuth?: boolean): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params, skipAuth });
  }

  async post<T>(endpoint: string, data?: unknown, skipAuth?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async put<T>(endpoint: string, data?: unknown, skipAuth?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, skipAuth?: boolean): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async delete<T>(endpoint: string, skipAuth?: boolean): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', skipAuth });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
