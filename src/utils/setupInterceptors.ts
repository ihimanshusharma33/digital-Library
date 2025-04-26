import fetchInterceptor from './fetchInterceptor';
import { getApiBaseUrl } from './config';
import { API_ENDPOINTS } from './apiService';

/**
 * Setup all fetch interceptors
 */
export const setupInterceptors = (): void => {
  // Authentication interceptor to add auth tokens to all requests
  fetchInterceptor.addRequestInterceptor(async (url, config) => {
    // Don't add auth headers to non-API requests or requests that already have auth headers
    if (!url.includes(getApiBaseUrl()) || 
        (config.headers && (
          (config.headers instanceof Headers && config.headers.has('Authorization')) ||
          (typeof config.headers === 'object' && 'Authorization' in config.headers)
        ))) {
      return [url, config];
    }

    const token = localStorage.getItem('token') || '';
    
    // Get current user from localStorage for API authentication
    const currentUser = localStorage.getItem('currentUser');
    let authToken = '';
    
    if (currentUser) {
      try {
        // In a real app, you'd get the token from the user object or a separate token storage
        authToken = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user', error);
      }
    }

    // Add headers to the request
    const headers = new Headers(config.headers || {});
    
    // Set default content type if not specified
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Set auth header if we have a token
    if (authToken) {
      headers.set('Authorization', authToken);
    }

    return [url, { ...config, headers }];
  });

  // Format notification data for backend requirements
  fetchInterceptor.addRequestInterceptor(async (url, config) => {
    // Only process POST or PUT requests to the notices endpoint
    if (!url.includes(getApiBaseUrl() + API_ENDPOINTS.NOTICES) || 
        (config.method !== 'POST' && config.method !== 'PUT')) {
      return [url, config];
    }
    
    // Only try to transform if we have a JSON body
    if (config.body && typeof config.body === 'string') {
      try {
        // Parse the current request body
        const currentBody = JSON.parse(config.body);
        
        // Transform to match the required backend format
        const transformedBody = {
          title: currentBody.title,
          description: currentBody.description,
          user_id: currentBody.user_id || 1, // Default to 1 if not provided
          course_code: currentBody.course_code || null, // Use course_code directly 
          semester: currentBody.semester || null,
          notification_type: currentBody.notification_type || "general",
          expires_at: currentBody.expires_at || currentBody.expiry_date || null
        };
        
        // Create a new config with the transformed body
        return [url, {
          ...config,
          body: JSON.stringify(transformedBody)
        }];
      } catch (error) {
        console.error('Error formatting notification data:', error);
      }
    }
    
    return [url, config];
  });

  // Response interceptor for handling common response scenarios
  fetchInterceptor.addResponseInterceptor(async (response) => {
    // Handle authentication issues
    if (response.status === 401) {
      // Clear user session on 401 Unauthorized
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      
      // Redirect to login page if we get a 401
      if (!window.location.pathname.includes('/signin')) {
        window.location.href = '/signin';
      }
    }
    
    // Handle forbidden
    if (response.status === 403) {
      console.warn('Access forbidden:', response.url);
    }
    
    return response;
  });

  // Error handler for network errors and other failures
  fetchInterceptor.addErrorHandler(async (error, url, config) => {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('Network error:', error);
      
      // Create a custom response for network errors
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Network error. Please check your internet connection.',
        }),
        {
          status: 0,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Handle other types of errors
    console.error('Fetch error:', { error, url, method: config.method });
    
    // Re-throw the error to be handled by the component
    throw error;
  });

  // Response interceptor for logging
  if (process.env.NODE_ENV === 'development') {
    fetchInterceptor.addResponseInterceptor(async (response) => {
      const method = response.type;
      const url = response.url;
      console.log(`%c ${method} ${url} ${response.status}`, 
        `color: ${response.ok ? 'green' : 'red'}; font-weight: bold;`);
      return response;
    });
  }
};

export default setupInterceptors;