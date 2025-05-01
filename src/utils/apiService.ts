import { 
  Course,
  Notice,
  ApiResponse, 
  CourseResponse,
  BookFilterParams,
  LoginRequest,
  LoginResponse,
  ResourceApiResponse,
  ResourcesResponse,
  Student,
  Book,
  StudentFormData,
  UserSearchResponse,
  IssuedBook
} from '../types';
import { getApiBaseUrl, setEnvironment, Environment } from './config';

/* ---------- 1. API ENDPOINTS -------------------------------------------- */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login', // Updated to match your actual endpoint
  REGISTER: '/register',
  LOGOUT: '/logout',

  // Library resources
  BOOKS: '/books',
  EBOOKS: '/ebooks',
  NOTES: '/notes',
  QUESTION_PAPERS: '/oldquestion',
  NOTICES: '/notices',
  RESOURCES: '/resources',

  // Courses
  COURSES: '/course',
  
  // Students and Users
  STUDENTS: '/users', // If this is the correct endpoint
  USERS: '/user',     // Added for user-specific endpoints

  // Custom endpoints
  RESOURCE_UPLOAD: '/resources',
  
  // NOC and Documents
  DOCUMENTS: '/documents',
} as const;

/* ---------- 2. REQUEST MANAGEMENT -------------------------------------- */

// Cache for responses that don't change frequently
const responseCache = new Map<string, {
  data: any;
  timestamp: number;
  expiresIn: number;
}>();

// Request controller to allow cancelling in-flight requests
const requestControllers = new Map<string, AbortController>();

// Cache config
const CACHE_DEFAULT_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_ENABLED_ENDPOINTS = [
  API_ENDPOINTS.COURSES,
  `${API_ENDPOINTS.BOOKS}?`,
  API_ENDPOINTS.RESOURCES
];

/* ---------- 3. INTERNAL HELPERS ----------------------------------------- */

// Pull token from wherever you store it
const authToken = () => localStorage.getItem('auth_token');

const defaultHeaders = (): HeadersInit => ({
  ...(authToken() && { Authorization: `Bearer ${authToken()}` }),
  Accept: 'application/json',
});

// Enhanced response parser with better error handling
async function parseResponse<T>(res: Response): Promise<T> {
  // For non-JSON responses (like file downloads)
  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    // For blob/file responses
    if (contentType.includes('application/pdf') || 
        contentType.includes('image/') ||
        contentType.includes('application/octet-stream')) {
      return res.blob() as unknown as T;
    }
    // For plain text
    return res.text() as unknown as T;
  }

  // For JSON responses
  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    const errorMessage = json?.message ||
      (json?.errors ? Object.values(json.errors).flat().join(' ') : res.statusText);
    
    const error = new Error(errorMessage);
    // Add additional error info
    (error as any).status = res.status;
    (error as any).response = json;
    throw error;
  }
  
  return json as T;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>) {
  // Use the centralized config to get the base URL
  const url = new URL(`${getApiBaseUrl()}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(
      ([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }
    );
  }
  return url.toString();
}

function toFormData(obj: Record<string, unknown>, file?: File) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null && v !== undefined) {
      // Handle array values
      if (Array.isArray(v)) {
        v.forEach((item, index) => {
          fd.append(`${k}[${index}]`, String(item));
        });
      } else if (typeof v === 'object' && !(v instanceof File)) {
        // Handle object values
        fd.append(k, JSON.stringify(v));
      } else {
        fd.append(k, String(v));
      }
    }
  });
  if (file) fd.append('file', file);
  return fd;
}

// Cache management
function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  return params ? `${endpoint}?${new URLSearchParams(params as Record<string, string>).toString()}` : endpoint;
}

function shouldCacheEndpoint(url: string): boolean {
  return CACHE_ENABLED_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function getFromCache<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  
  // Check if cache is expired
  if (Date.now() - cached.timestamp > cached.expiresIn) {
    responseCache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

function saveToCache<T>(key: string, data: T, expiresIn = CACHE_DEFAULT_DURATION): void {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresIn
  });
}

function clearCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  responseCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  });
}

/* ---------- 4. HTTP CLIENT ---------------------------------------------- */

// Base HTTP client with unified API URL handling and improved error management
const httpClient = {
  get: async <T>(
    endpoint: string, 
    params?: Record<string, unknown>, 
    options?: { 
      useCache?: boolean; 
      cacheTime?: number;
      signal?: AbortSignal;
    }
  ): Promise<T> => {
    const url = buildUrl(endpoint, params as Record<string, string | number | boolean | undefined | null> | undefined);
    const cacheKey = getCacheKey(endpoint, params);
    
    // Support request cancellation
    const requestId = cacheKey;
    if (requestControllers.has(requestId)) {
      requestControllers.get(requestId)!.abort();
    }
    const controller = new AbortController();
    requestControllers.set(requestId, controller);
    
    // Check cache if enabled
    if (options?.useCache !== false && shouldCacheEndpoint(url)) {
      const cachedData = getFromCache<T>(cacheKey);
      if (cachedData) {
        requestControllers.delete(requestId);
        return Promise.resolve(cachedData);
      }
    }
    
    try {
      const response = await fetch(url, { 
        headers: defaultHeaders(),
        signal: options?.signal || controller.signal
      });
      
      const data = await parseResponse<T>(response);
      
      // Save to cache if appropriate
      if (options?.useCache !== false && shouldCacheEndpoint(url)) {
        saveToCache(cacheKey, data, options?.cacheTime);
      }
      
      return data;
    } finally {
      requestControllers.delete(requestId);
    }
  },

  post: async <T, U = unknown>(
    endpoint: string,
    data?: U,
    options?: { clearCachePattern?: string }
  ): Promise<T> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { ...defaultHeaders(), 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      const result = await parseResponse<T>(response);
      
      // Clear relevant cache entries after successful mutations
      if (options?.clearCachePattern) {
        clearCache(options.clearCachePattern);
      }
      
      return result;
    } catch (error) {
      console.error(`API Error (POST ${endpoint}):`, error);
      throw error;
    }
  },

  put: async <T, U = unknown>(
    endpoint: string, 
    data?: U, 
    options?: { clearCachePattern?: string }
  ): Promise<T> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers: { ...defaultHeaders(), 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      const result = await parseResponse<T>(response);
      
      // Clear relevant cache entries after successful mutations
      if (options?.clearCachePattern) {
        clearCache(options.clearCachePattern);
      }
      
      return result;
    } catch (error) {
      console.error(`API Error (PUT ${endpoint}):`, error);
      throw error;
    }
  },

  delete: async <T>(
    endpoint: string, 
    options?: { clearCachePattern?: string }
  ): Promise<T> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: defaultHeaders(),
      });
      
      const result = await parseResponse<T>(response);
      
      // Clear relevant cache entries after successful mutations
      if (options?.clearCachePattern) {
        clearCache(options.clearCachePattern);
      }
      
      return result;
    } catch (error) {
      console.error(`API Error (DELETE ${endpoint}):`, error);
      throw error;
    }
  },

  upload: async <T>(
    endpoint: string,
    fields: Record<string, unknown>,
    file?: File,
    options?: { 
      method?: 'POST' | 'PUT'; 
      onProgress?: (percentage: number) => void;
      clearCachePattern?: string;
    }
  ): Promise<ApiResponse<T>> => {
    try {
      // Use XMLHttpRequest for upload progress support
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = toFormData(fields, file);
        
        xhr.open(options?.method || 'POST', `${getApiBaseUrl()}${endpoint}`);
        
        // Add auth header
        const token = authToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              
              // Clear relevant cache entries after successful mutations
              if (options?.clearCachePattern) {
                clearCache(options.clearCachePattern);
              }
              
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject({
                status: xhr.status,
                message: errorData.message || 'Upload failed',
                response: errorData
              });
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error during upload'));
        };
        
        // Upload progress event
        if (options?.onProgress) {
          xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              options.onProgress?.(percentComplete);
            }
          };
        }
        
        xhr.send(formData);
      });
    } catch (error) {
      console.error(`API Error (Upload ${endpoint}):`, error);
      throw error;
    }
  },
  
  // Method to cancel pending requests
  cancelRequest: (endpoint: string, params?: Record<string, unknown>) => {
    const cacheKey = getCacheKey(endpoint, params);
    if (requestControllers.has(cacheKey)) {
      requestControllers.get(cacheKey)!.abort();
      requestControllers.delete(cacheKey);
      return true;
    }
    return false;
  },
  
  // Method to clear specific parts of the cache
  clearCache
};

/* ---------- 5. PUBLIC API OBJECT --------------------------------------- */

// Domain-specific API functions that use the HTTP client
export const api = {
  /* ---- Generic HTTP methods ------------------------------------------ */
  ...httpClient,

  /* ---- Auth API ----------------------------------------------------- */
  login: (data: LoginRequest) =>
    httpClient.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.LOGIN, data),

  register: (data: Omit<LoginRequest, 'password'> & { password: string }) =>
    httpClient.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.REGISTER, data),

  logout: () =>
    httpClient.post<ApiResponse>(API_ENDPOINTS.LOGOUT),

  /* ---- Courses API -------------------------------------------------- */
  getCourses: (useCache = true) =>
    httpClient.get<ApiResponse<CourseResponse['data']>>(
      API_ENDPOINTS.COURSES, 
      undefined, 
      { useCache }
    ),
    
  createCourse: (data: Partial<Course>) =>
    httpClient.post<ApiResponse<Course>>(
      API_ENDPOINTS.COURSES, 
      data, 
      { clearCachePattern: API_ENDPOINTS.COURSES }
    ),
    
  updateCourse: (id: number, data: Partial<Course>) =>
    httpClient.put<ApiResponse<Course>>(
      `${API_ENDPOINTS.COURSES}/${id}`, 
      data, 
      { clearCachePattern: API_ENDPOINTS.COURSES }
    ),

  /* ---- Books API ---------------------------------------------------- */
  getBooks: (filters?: BookFilterParams, useCache = true) =>
    httpClient.get<ApiResponse>(
      API_ENDPOINTS.BOOKS, 
      filters as Record<string, unknown>, 
      { useCache }
    ),

  getBooksByCourseAndSemester: (
    course_code?: string,
    semester?: number,
    useCache = true
  ) =>
    httpClient.get<ApiResponse>(
      API_ENDPOINTS.BOOKS,
      course_code || semester ? { course_code, semester } : undefined,
      { useCache }
    ),
    
  searchBooks: (query: string, type: 'title' | 'author' | 'isbn' | 'id' = 'title') =>
    httpClient.get<ApiResponse<Book[]>>(
      `${API_ENDPOINTS.BOOKS}/availability?type=${type}&value=${encodeURIComponent(query)}`
    ),

  /* ---- Resources API ------------------------------------------------ */
  getResources: (filters?: BookFilterParams, useCache = true) =>
    httpClient.get<ResourceApiResponse<ResourcesResponse>>(
      API_ENDPOINTS.RESOURCES, 
      filters as Record<string, unknown>, 
      { useCache }
    ),

  /* ---- Delete Resources API ----------------------------------------- */
  deleteEbook: (id: string) => 
    httpClient.delete<ApiResponse>(
      `${API_ENDPOINTS.EBOOKS}/${id}`,
      { clearCachePattern: API_ENDPOINTS.RESOURCES }
    ),

  deleteNote: (id: string) => 
    httpClient.delete<ApiResponse>(
      `${API_ENDPOINTS.NOTES}/${id}`,
      { clearCachePattern: API_ENDPOINTS.RESOURCES }
    ),

  deleteQuestionPaper: (id: string) => 
    httpClient.delete<ApiResponse>(
      `${API_ENDPOINTS.QUESTION_PAPERS}/${id}`,
      { clearCachePattern: API_ENDPOINTS.RESOURCES }
    ),


  /* ---- Update Resources API ----------------------------------------- */
  updateEbook: (
    id: string, 
    data: Record<string, unknown>, 
    file?: File, 
    onProgress?: (percentage: number) => void
  ) => 
    file ? 
      httpClient.upload(
        `${API_ENDPOINTS.EBOOKS}/${id}?_method=PUT`, 
        data, 
        file, 
        { 
          onProgress, 
          clearCachePattern: API_ENDPOINTS.RESOURCES 
        }
      ) :
      httpClient.put<ApiResponse>(
        `${API_ENDPOINTS.EBOOKS}/${id}`, 
        data, 
        { clearCachePattern: API_ENDPOINTS.RESOURCES }
      ),

  updateNote: (
    id: string, 
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) => 
    file ?
      httpClient.upload(
        `${API_ENDPOINTS.NOTES}/${id}?_method=PUT`, 
        data, 
        file, 
        { 
          onProgress,
          clearCachePattern: API_ENDPOINTS.RESOURCES 
        }
      ) :
      httpClient.put<ApiResponse>(
        `${API_ENDPOINTS.NOTES}/${id}`, 
        data,
        { clearCachePattern: API_ENDPOINTS.RESOURCES }
      ),

  updateQuestionPaper: (
    id: string, 
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) => 
    file ?
      httpClient.upload(
        `${API_ENDPOINTS.QUESTION_PAPERS}/${id}?_method=PUT`, 
        data, 
        file,
        { 
          onProgress,
          clearCachePattern: API_ENDPOINTS.RESOURCES 
        }
      ) :
      httpClient.put<ApiResponse>(
        `${API_ENDPOINTS.QUESTION_PAPERS}/${id}`, 
        data,
        { clearCachePattern: API_ENDPOINTS.RESOURCES }
      ),

  
  /* ---- Uploads API (books, notes, question papers) ------------------ */
  uploadBook: (
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) =>
    httpClient.upload(
      API_ENDPOINTS.BOOKS, 
      data, 
      file, 
      { 
        onProgress,
        clearCachePattern: API_ENDPOINTS.BOOKS
      }
    ),
    
  uploadEbook: (
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) =>
    httpClient.upload(
      API_ENDPOINTS.EBOOKS, 
      data, 
      file,
      { 
        onProgress,
        clearCachePattern: API_ENDPOINTS.RESOURCES
      }
    ),

  uploadNotes: (
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) =>
    httpClient.upload(
      API_ENDPOINTS.NOTES, 
      data, 
      file,
      { 
        onProgress,
        clearCachePattern: API_ENDPOINTS.RESOURCES
      }
    ),

  uploadQuestionPaper: (
    data: Record<string, unknown>, 
    file?: File,
    onProgress?: (percentage: number) => void
  ) =>
    httpClient.upload(
      API_ENDPOINTS.QUESTION_PAPERS, 
      data, 
      file,
      { 
        onProgress,
        clearCachePattern: API_ENDPOINTS.RESOURCES
      }
    ),

  /* ---- Custom resource upload with specific JSON format ------------- */
  uploadResourceWithJSON: async <T>(
    data: {
      title: string;
      description: string;
      author: string;
      course_code: string;
      semester: number;
      subject: string;
    },
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    
    // Add all JSON fields individually to the FormData
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('author', data.author);
    formData.append('course_code', data.course_code);
    formData.append('semester', data.semester.toString());
    formData.append('subject', data.subject);
    formData.append('file', file);

    return httpClient.upload(
      API_ENDPOINTS.RESOURCE_UPLOAD, 
      {}, 
      file,
      { onProgress }
    );
  },

  /* ---- Notices API -------------------------------------------------- */
  
  /**
   * Get all notices
   * @returns Promise with all notices
   */
  getNotices: (useCache = true) => 
    httpClient.get<ApiResponse<Notice[]>>(
      API_ENDPOINTS.NOTICES,
      undefined,
      { useCache }
    ),
  
  /**
   * Create a new notice
   * @param data Notice data
   * @returns Promise with the created notice
   */
  createNotice: (data: {
    title: string;
    content: string;
    is_active: boolean;
    publish_date: string;
    end_date: string;
  }) => 
    httpClient.post<ApiResponse<Notice>>(
      API_ENDPOINTS.NOTICES, 
      data,
      { clearCachePattern: API_ENDPOINTS.NOTICES }
    ),
  
  /**
   * Update an existing notice
   * @param id Notice ID
   * @param data Updated notice data
   * @returns Promise with the updated notice
   */
  updateNotice: (id: number | string, data: {
    title?: string;
    content?: string;
    is_active?: boolean;
    publish_date?: string;
    end_date?: string;
  }) => 
    httpClient.put<ApiResponse<Notice>>(
      `${API_ENDPOINTS.NOTICES}/${id}`, 
      data,
      { clearCachePattern: API_ENDPOINTS.NOTICES }
    ),
  
  /**
   * Delete a notice
   * @param id Notice ID
   * @returns Promise with deletion status
   */
  deleteNotice: (id: number | string) =>
    httpClient.delete<ApiResponse>(
      `${API_ENDPOINTS.NOTICES}/${id}`,
      { clearCachePattern: API_ENDPOINTS.NOTICES }
    ),
  
  /**
   * Get a specific notice by ID
   * @param id Notice ID
   * @returns Promise with notice details
   */
  getNotice: (id: number | string) =>
    httpClient.get<ApiResponse<Notice>>(`${API_ENDPOINTS.NOTICES}/${id}`),

  /* ---- Students API ------------------------------------------------- */
  getStudents: () =>
    httpClient.get<ApiResponse<Student[]>>(API_ENDPOINTS.STUDENTS),

  createStudent: (data: StudentFormData) =>
    httpClient.post<ApiResponse<Student>>(
      API_ENDPOINTS.STUDENTS, 
      data,
      { clearCachePattern: API_ENDPOINTS.STUDENTS }
    ),

  updateStudent: (id: number | string, data: Partial<StudentFormData>) =>
    httpClient.put<ApiResponse<Student>>(
      `${API_ENDPOINTS.STUDENTS}/${id}`, 
      data,
      { clearCachePattern: API_ENDPOINTS.STUDENTS }
    ),

  deleteStudent: (id: number | string) =>
    httpClient.delete<ApiResponse>(
      `${API_ENDPOINTS.STUDENTS}/${id}`,
      { clearCachePattern: API_ENDPOINTS.STUDENTS }
    ),

  searchUserByLibraryId: (libraryId: string) => 
    httpClient.get<UserSearchResponse>(`/user/search/library-id?library_id=${encodeURIComponent(libraryId)}`),

  /* ---- Books Issue/Return API --------------------------------------- */
  
  issueBook: (data: {
    book_id: number | string;
    user_id: number | string;
    issue_date: string;
    due_date: string;
    issued_by: number | string;
    issued_by_name?: string;
    remarks?: string;
  }) => 
    httpClient.post<ApiResponse<any>>(
      '/issue-book', 
      data,
      { clearCachePattern: '/user/issued-books' }
    ),

  getUserIssuedBooks: (libraryId: string) => 
    httpClient.get<ApiResponse<IssuedBook[]>>(`/issued-books?library_id=${encodeURIComponent(libraryId)}`),

  returnBook: (data: {
    issued_book_id: number;
    return_date: string;
    fine_amount?: number;
    remarks?: string;
  }) => 
    httpClient.post<ApiResponse<any>>(
      `/return-book`, 
      data,
      { clearCachePattern: '/user/issued-books' }
    ),
    
  /* ---- User and Authentication API ---------------------------------- */
  
  getUserDetails: (userId: number | string) =>
    httpClient.get<ApiResponse<Student>>(`${API_ENDPOINTS.USERS}/${userId}`),
    
  // New method specifically for getting user profile data
  
  getUserProfile: (userId: number | string) =>
    httpClient.get<ApiResponse<Student>>(`/user/${userId}`),

  /* ---- Documents API (NOC, etc.) ------------------------------------ */
  
  generateNOC: (data: {
    studentId: string | number;
    reason: string;
    remarks?: string;
    date: string;
    logoUrl?: string;
    studentInfo?: Record<string, any>;
  }) =>
    httpClient.post<ApiResponse<{ documentUrl: string }>>(`${API_ENDPOINTS.DOCUMENTS}/noc`, data),
};

// Export a method to check or change the environment at runtime
export const apiEnvironment = {
  getCurrent: (): Environment => getApiBaseUrl() as Environment,
  
  // Use this to switch environments programmatically if needed
  setEnvironment: (env: Environment) => {
    setEnvironment(env);
    // Clear cache when changing environments
    clearCache();
    return getApiBaseUrl();
  }
};
