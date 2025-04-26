// Import the API base URL utility
import { getApiBaseUrl } from './config';
import { API_ENDPOINTS } from './apiService';

// Save the original fetch function
const originalFetch = window.fetch;

// Types for our interceptor
type RequestInterceptor = (url: string, config: RequestInit) => Promise<[string, RequestInit]>;
type ResponseInterceptor = (response: Response) => Promise<Response>;
type ErrorHandler = (error: any, url: string, config: RequestInit) => Promise<Response | never>;

// Store for interceptors
const interceptors = {
  request: [] as RequestInterceptor[],
  response: [] as ResponseInterceptor[],
  error: [] as ErrorHandler[],
};

// Parse response based on content type
export const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  if (contentType?.includes('text/')) {
    return response.text();
  }
  
  return response.blob();
};

// Helper function to check if a URL is an API endpoint and prepend base URL if needed
const ensureBaseUrl = (url: string): string => {
  // Skip URLs that already have a domain or are not API calls
  if (url.startsWith('http') || url.startsWith('//')) {
    return url;
  }

  // Check if it's an API endpoint (starts with a path in API_ENDPOINTS)
  const isApiEndpoint = Object.values(API_ENDPOINTS).some(endpoint => 
    url === endpoint || url.startsWith(`${endpoint}/`) || url.startsWith(`${endpoint}?`)
  );

  if (isApiEndpoint) {
    // It's an API endpoint without base URL, prepend the base URL
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${url}`;
  }

  return url;
};

// Override the global fetch
window.fetch = async function(
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<Response> {
  let requestUrl: string;
  let requestConfig: RequestInit = init || {};

  try {
    // Handle different input types properly
    if (input instanceof Request) {
      requestUrl = input.url;
      requestConfig = {
        method: input.method,
        headers: input.headers,
        body: input.bodyUsed ? undefined : input.body,
        mode: input.mode,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
        ...requestConfig
      };
    } else {
      requestUrl = input.toString();
    }

    // Apply base URL logic
    requestUrl = ensureBaseUrl(requestUrl);
    
    // Apply request interceptors
    for (const interceptor of interceptors.request) {
      [requestUrl, requestConfig] = await interceptor(requestUrl, requestConfig);
    }
    
    // Make the actual fetch call
    const response = await originalFetch(requestUrl, requestConfig);
    
    let interceptedResponse = response;
    
    // Apply response interceptors
    for (const interceptor of interceptors.response) {
      interceptedResponse = await interceptor(interceptedResponse.clone());
    }
    
    return interceptedResponse;
  } catch (error) {
    // Apply error handlers
    for (const handler of interceptors.error) {
      try {
        return await handler(error, typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url), requestConfig);
      } catch (innerError) {
        // Continue to the next error handler if this one throws
        if (innerError !== error) {
          error = innerError;
        }
      }
    }
    
    // If no error handler resolves, throw the error
    throw error;
  }
};

// API to add request interceptors
export const addRequestInterceptor = (interceptor: RequestInterceptor): number => {
  return interceptors.request.push(interceptor);
};

// API to add response interceptors
export const addResponseInterceptor = (interceptor: ResponseInterceptor): number => {
  return interceptors.response.push(interceptor);
};

// API to add error handlers
export const addErrorHandler = (handler: ErrorHandler): number => {
  return interceptors.error.push(handler);
};

// API to remove interceptors
export const removeInterceptor = (type: 'request' | 'response' | 'error', id: number): void => {
  if (id > 0 && id <= interceptors[type].length) {
    interceptors[type].splice(id - 1, 1);
  }
};

// API to clear all interceptors
export const clearInterceptors = (type?: 'request' | 'response' | 'error'): void => {
  if (type) {
    interceptors[type] = [];
  } else {
    interceptors.request = [];
    interceptors.response = [];
    interceptors.error = [];
  }
};

export default {
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorHandler,
  removeInterceptor,
  clearInterceptors,
  parseResponse
};