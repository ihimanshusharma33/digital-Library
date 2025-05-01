// Import the API base URL utility
import { logout } from './AuthContext';
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
  const contentType = response.headers.get('content-type') || '';
  
  // Special handling for 401 - but DON'T log out here (let the error handler do that)
  if (response.status === 401) {
    console.error('401 Unauthorized response detected');
    
    // Check for HTML responses
    if (contentType.includes('text/html')) {
      console.log('HTML 401 response detected - parsing as structured error');
      return {
        status: false,
        message: 'Authentication error: Please log in again',
        data: null
      };
    }
    
    // Let the normal flow continue - JSON errors will be handled below
  }
  
  // Handle error status codes
  if (!response.ok) {
    // For JSON errors
    if (contentType.includes('application/json')) {
      try {
        const errorJson = await response.json();
        return {
          status: false,
          message: errorJson.message || `Error: ${response.status} ${response.statusText}`,
          errors: errorJson.errors,
          data: null
        };
      } catch (e) {
        console.error('Failed to parse JSON error response:', e);
      }
    }
    
    // For HTML error pages - With a more lenient check (any HTML-like content)
    if (contentType.includes('text/html') || contentType.includes('html')) {
      console.log(`HTML error detected (status ${response.status})`);
      try {
        // Just log a bit of the HTML for debugging
        const text = await response.text();
        console.log('HTML response preview:', text.substring(0, 100) + '...');
        
        return {
          status: false,
          message: `Error ${response.status}: ${response.statusText}`,
          data: null,
          htmlResponse: true
        };
      } catch (htmlError) {
        console.error('Error reading HTML response:', htmlError);
      }
    }
    
    // Default error response for other types
    return {
      status: false,
      message: `Request failed with status ${response.status}: ${response.statusText}`,
      data: null
    };
  }
  
  // For successful responses, parse according to content type
  try {
    // JSON responses
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json();
      return jsonData;
    }
    
    // Text responses (HTML, plain text)
    if (contentType?.includes('text/')) {
      const text = await response.text();
      // Try to parse as JSON in case content-type is incorrect
      try {
        return JSON.parse(text);
      } catch (e) {
        // Not JSON, return as text
        return { status: true, data: text };
      }
    }
    
    // Binary data
    if (contentType?.includes('application/pdf') || 
        contentType?.includes('image/') ||
        contentType?.includes('application/octet-stream')) {
      const blob = await response.blob();
      return { status: true, data: blob };
    }
    
    // For any other content type or missing content type, try multiple approaches
    // First try as JSON
    try {
      return await response.json();
    } catch (jsonError) {
      // Then as text
      try {
        const text = await response.text();
        return { status: true, data: text };
      } catch (textError) {
        // Finally as blob
        try {
          const blob = await response.blob();
          return { status: true, data: blob };
        } catch (blobError) {
          // If all fails, return empty success
          return { status: true, data: null };
        }
      }
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    return {
      status: false,
      message: 'Failed to parse server response',
      data: null
    };
  }
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

// Add an error handler for authentication issues
clearInterceptors('error');

addErrorHandler(async (error, url, config) => {
  // Check if this is a 401 error
  if (error.status === 401 || (error.response && error.response.status === 401)) {
    console.error('Authentication error detected in fetch interceptor');
    
    // Instead of immediately redirecting, schedule the logout
    setTimeout(() => {
      try {
        logout();
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
        // Fallback logout
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        
        // Delay the redirect slightly to allow the current request to complete
        setTimeout(() => {
          window.location.href = '/signin';
        }, 100);
      }
    }, 300); // Small delay to let the current request finish processing
    
    // Return a structured response instead of throwing
    return new Response(JSON.stringify({
      status: false,
      message: 'Authentication failed. Please log in again.',
      data: null
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  // Re-throw other errors
  throw error;
});

export default {
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorHandler,
  removeInterceptor,
  clearInterceptors,
  parseResponse
};