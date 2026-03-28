const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;
  const isFormData = fetchOptions.body instanceof FormData;

  const getHeaders = (storedToken?: string | null) => {
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const t = storedToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (t) headers['Authorization'] = `Bearer ${t}`;
    return headers;
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: getHeaders(token),
  });

  // Handle 401 and attempt refresh
  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      handleAuthFailure();
      throw new Error('Unauthorized');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
          },
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          isRefreshing = false;
          refreshQueue.forEach((cb) => cb(tokens.accessToken));
          refreshQueue = [];
          
          const retryResponse = await fetch(`${API_URL}${endpoint}`, { 
            ...fetchOptions, 
            headers: getHeaders(tokens.accessToken) 
          });
          return await retryResponse.json();
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        isRefreshing = false;
        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];
        handleAuthFailure();
        throw new Error('Unauthorized');
      }
    } else {
      // Wait for existing refresh to complete
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (newToken) {
            fetch(`${API_URL}${endpoint}`, { 
              ...fetchOptions, 
              headers: getHeaders(newToken) 
            }).then(res => res.json()).then(resolve).catch(reject);
          } else {
            reject(new Error('Unauthorized'));
          }
        });
      });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  // Handle empty responses (204 etc)
  if (response.status === 204) return null;
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response;
}

function handleAuthFailure() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
}

export const api = {
  get: (endpoint: string, options?: FetchOptions) => fetchApi(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options?: FetchOptions) =>
    fetchApi(endpoint, { ...options, method: 'POST', body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined) }),
  put: (endpoint: string, data?: any, options?: FetchOptions) =>
    fetchApi(endpoint, { ...options, method: 'PUT', body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined) }),
  patch: (endpoint: string, data?: any, options?: FetchOptions) =>
    fetchApi(endpoint, { ...options, method: 'PATCH', body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined) }),
  delete: (endpoint: string, options?: FetchOptions) => fetchApi(endpoint, { ...options, method: 'DELETE' }),
  download: async (endpoint: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Download failed');
    }
    return response.blob();
  },
};
