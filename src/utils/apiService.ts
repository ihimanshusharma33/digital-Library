/* ---------------------------------------------------------
   src/utils/apiService.ts
   Fully‑typed helper for Werev Library backend (__define-ocg__)
---------------------------------------------------------- */

import { Course } from '../types';
import { getApiBaseUrl, setEnvironment, Environment } from './config';

/* ---------- 1. API ENDPOINTS -------------------------------------------- */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',

  // Library resources
  BOOKS: '/books',
  EBOOKS: '/ebooks',
  NOTES: '/notes',
  QUESTION_PAPERS: '/oldquestion',
  NOTICES: '/notices',
  RESOURCES: '/resources',

  // Courses
  COURSES: '/course',
  
  // Custom endpoints
  RESOURCE_UPLOAD: '/resources/upload',
} as const;

/* ---------- 2. SHARED TYPES --------------------------------------------- */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

// For resources with status field instead of success
export interface ResourceApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'admin';
  };
}

export interface CourseResponse {
  status: boolean;
  message: string;
  data: Course[];
}

// Ebook resource type
export interface Ebook {
  id: number;
  title: string;
  description: string;
  author: string;
  file_path: string;
  course_code: string;
  semester: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Note resource type
export interface Note {
  id: number;
  title: string;
  description: string;
  subject: string;
  author: string;
  file_path: string;
  course_code: string;
  semester: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Question paper resource type
export interface QuestionPaper {
  id: number;
  title: string;
  subject: string;
  year: number;
  exam_type: string;
  file_path: string;
  course_code: string;
  semester: number;
  description: string;
  created_at: string;
  updated_at: string;
}

// Combined resources response
export interface ResourcesResponse {
  ebooks: Ebook[];
  notes: Note[];
  question_papers: QuestionPaper[];
}

export interface BookFilterParams {
  course_code?: string;
  semester?: number;
  category?: string;
  search?: string;
}

export interface ResourceUploadData {
  title: string;
  description: string;
  author: string;
  course_code: string;
  semester: number;
  subject: string;
  file?: File;
}

/* ---------- 3. INTERNAL HELPERS ----------------------------------------- */

// Pull token from wherever you store it
const authToken = () => localStorage.getItem('token');

const defaultHeaders = (): HeadersInit => ({
  ...(authToken() && { Authorization: `Bearer ${authToken()}` }),
  Accept: 'application/json',
});

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Laravel validation errors
    const message =
      json?.message ||
      (json?.errors ? Object.values(json.errors).flat().join(' ') : res.statusText);
    throw new Error(message);
  }
  return json as T;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>) {
  // Use the centralized config to get the base URL
  const url = new URL(`${getApiBaseUrl()}${endpoint}`);
  if (params)
    Object.entries(params).forEach(
      ([k, v]) => v !== undefined && v !== null && url.searchParams.set(k, String(v)),
    );
  return url.toString();
}

function toFormData(obj: Record<string, unknown>, file?: File) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => v != null && fd.append(k, String(v)));
  if (file) fd.append('file', file);
  return fd;
}

/* ---------- 4. HTTP CLIENT ---------------------------------------------- */

// Base HTTP client with unified API URL handling
const httpClient = {
  get: async <T>(endpoint: string, params?: Record<string, unknown>): Promise<T> =>
    parseResponse<T>(
      await fetch(
        buildUrl(endpoint, params as Record<string, string | number | boolean> | undefined), 
        { headers: defaultHeaders() }
      ),
    ),

  post: async <T, U = unknown>(
    endpoint: string,
    data?: U,
  ): Promise<T> =>
    parseResponse<T>(
      await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { ...defaultHeaders(), 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      }),
    ),

  put: async <T, U = unknown>(endpoint: string, data?: U): Promise<T> =>
    parseResponse<T>(
      await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers: { ...defaultHeaders(), 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      }),
    ),

  delete: async <T>(endpoint: string): Promise<T> =>
    parseResponse<T>(
      await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers: defaultHeaders(),
      }),
    ),

  upload: async <T>(
    endpoint: string,
    fields: Record<string, unknown>,
    file?: File,
  ): Promise<ApiResponse<T>> =>
    parseResponse<ApiResponse<T>>(
      await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: defaultHeaders(), // do not set content-type!
        body: toFormData(fields, file), 
      }),
    ),
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
  getCourses: () =>
    httpClient.get<ApiResponse<CourseResponse['data']>>(API_ENDPOINTS.COURSES),

  /* ---- Books API ---------------------------------------------------- */
  getBooks: (filters?: BookFilterParams) =>
    httpClient.get<ApiResponse>(API_ENDPOINTS.BOOKS, filters as Record<string, unknown>),

  getBooksByCourseAndSemester: (
    course_code?: string,
    semester?: number,
  ) =>
    httpClient.get<ApiResponse>(
      API_ENDPOINTS.BOOKS,
      course_code || semester ? { course_code, semester } : undefined,
    ),
    
  /* ---- Resources API ------------------------------------------------ */
  getResources: (filters?: BookFilterParams) =>
    httpClient.get<ResourceApiResponse<ResourcesResponse>>(API_ENDPOINTS.RESOURCES, filters as Record<string, unknown>),

  /* ---- Delete Resources API ----------------------------------------- */
  deleteEbook: (id: string) => 
    httpClient.delete<ApiResponse>(`${API_ENDPOINTS.EBOOKS}/${id}`),

  deleteNote: (id: string) => 
    httpClient.delete<ApiResponse>(`${API_ENDPOINTS.NOTES}/${id}`),

  deleteQuestionPaper: (id: string) => 
    httpClient.delete<ApiResponse>(`${API_ENDPOINTS.QUESTION_PAPERS}/${id}`),

  /* ---- Update Resources API ----------------------------------------- */
  updateEbook: (id: string, data: Record<string, unknown>, file?: File) => 
    file ? 
      httpClient.upload(`${API_ENDPOINTS.EBOOKS}/${id}?_method=PUT`, data, file) :
      httpClient.put<ApiResponse>(`${API_ENDPOINTS.EBOOKS}/${id}`, data),

  updateNote: (id: string, data: Record<string, unknown>, file?: File) => 
    file ?
      httpClient.upload(`${API_ENDPOINTS.NOTES}/${id}?_method=PUT`, data, file) :
      httpClient.put<ApiResponse>(`${API_ENDPOINTS.NOTES}/${id}`, data),

  updateQuestionPaper: (id: string, data: Record<string, unknown>, file?: File) => 
    file ?
      httpClient.upload(`${API_ENDPOINTS.QUESTION_PAPERS}/${id}?_method=PUT`, data, file) :
      httpClient.put<ApiResponse>(`${API_ENDPOINTS.QUESTION_PAPERS}/${id}`, data),
  
  /* ---- Uploads API (books, notes, question papers) ------------------ */
  uploadBook: (data: Record<string, unknown>, file?: File) =>
    httpClient.upload(API_ENDPOINTS.BOOKS, data, file),
    
  uploadEbook: (data: Record<string, unknown>, file?: File) =>
    httpClient.upload(API_ENDPOINTS.EBOOKS, data, file),

  uploadNotes: (data: Record<string, unknown>, file?: File) =>
    httpClient.upload(API_ENDPOINTS.NOTES, data, file),

  uploadQuestionPaper: (data: Record<string, unknown>, file?: File) =>
    httpClient.upload(API_ENDPOINTS.QUESTION_PAPERS, data, file),

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

    return parseResponse<ApiResponse<T>>(
      await fetch(`${getApiBaseUrl()}${API_ENDPOINTS.RESOURCE_UPLOAD}`, {
        method: 'POST',
        headers: defaultHeaders(), 
        body: formData
      }),
    );
  }
};

// Export a method to check or change the environment at runtime
export const apiEnvironment = {
  getCurrent: (): Environment => getApiBaseUrl() as Environment,
  
  // Use this to switch environments programmatically if needed
  setEnvironment: (env: Environment) => {
    setEnvironment(env);
    return getApiBaseUrl();
  }
};
