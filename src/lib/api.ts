import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  responseType?: 'json' | 'text' | 'blob';
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = Cookies.get('auth_token');
  const language = Cookies.get('NEXT_LOCALE') || 'ar';
  
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Language', language);
  
    // Extract tenant from subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      const ignoredSubdomains = ['www', 'api', 'admin'];
      
      if (hostname !== 'localhost') {
          // Localhost subdomains like company.localhost
          if (hostname.endsWith('.localhost') && parts.length >= 2) {
              headers.set('X-Tenant', parts[0]);
          } 
          // Production subdomains like company.rafed.com
          else if (parts.length >= 3 && !ignoredSubdomains.includes(parts[0])) {
              headers.set('X-Tenant', parts[0]);
          }
      }
    }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let responseData: any = null;
  if (options.responseType === 'blob') {
    responseData = await response.blob();
  } else {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
  }

  if (!response.ok) {
    const errorMessage = responseData?.message || response.statusText || 'حدث خطأ ما';
    
    if (response.status === 403 && responseData?.message === 'Tenant not found.') {
        if (typeof window !== 'undefined') {
            window.location.href = '/not-found-company';
        }
    }

    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
