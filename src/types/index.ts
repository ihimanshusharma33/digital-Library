// Course related types
export interface Course {
  id: number;
  course_code: string;
  course_name: string;
  description: string;
  total_semesters: number;
  department: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Maintain backward compatibility with existing code
  name?: string;
  code?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: number;
  number: number;
  course_id: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

// Common interface for all resource types
export interface ResourceBase {
  id: number;
  title: string;
  file_path: string;
  description?: string;
  uploaded_by: string;
  upload_date: string;
  course_code: string;
  semester: number;
  file_type: string;
}

export interface Resume extends ResourceBase {
  type: 'resume';
}

export interface Note extends ResourceBase {
  type: 'note';
}

export interface QuestionPaper extends ResourceBase {
  type: 'question_paper';
  exam_type?: string; // mid-term, final, etc.
  year?: string;
}

export type ResourceType = 'resume' | 'note' | 'question_paper';

// Legacy Resource interface
export interface Resource {
  id: string;
  title: string;
  uploadedBy: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'xlsx' | 'image' | 'other';
  url: string;
  courseId: string;
  category: 'textbook' | 'notes' | 'questions';
  uploadDate: string;
  description?: string;
  semester: number; // Adding semester information
  author?: string; // Optional author field for textbooks
  edition?: string; // Optional edition field for textbooks
  publicationYear?: number; // Optional publication year for textbooks
  publisher?: string; // Optional publisher field for textbooks
  location?: string; // Optional location field for textbooks
  totalCopies?: number; // Optional total copies field for textbooks
  availableCopies?: number; // Optional available copies field for textbooks
  maxBooksAllowed?: number; // Optional max books allowed field for textbooks
  createdAt?: string; // Optional created at field for textbooks
  isbn?: string; // Optional ISBN field for textbooks
  publication_year?: number; // Optional publication year field for textbooks
  quantity?: number; // Optional quantity field for textbooks
  shelf_location?: string; // Optional shelf location field for textbooks
  subject?: string; // Optional subject field for textbooks
  exam_type?: string; // Optional exam type field for question papers
  year?: string; // Optional year field for question papers
  available_quantity?: number; // Optional available quantity field for textbooks
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  course_code: string;
  semester?: number; // Making semester optional for notices
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
  priority?: 'low' | 'medium' | 'high';
  expiry_date?: string;
  created_by?: string;
}

// Fixed to match the actual category values used in Resource interface
export type ResourceCategory = 'textbooks' | 'notes' | 'questions' | 'notices';

// Auth and User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'librarian' | 'faculty';
  createdAt: string;
  profile_image?: string;
  department?: string;
  enrollment_number?: string;
  contact_number?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'admin' | 'librarian' | 'faculty';
  enrollment_number?: string;
  department?: string;
}

// Student dashboard related types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  coverImage: string;
  availableCopies: number;
  courseCode?: string; // Optional course code for filtering books
  semester?: number; // Optional semester for filtering books
  publisher?: string;
  publication_year?: number;
  edition?: string;
  location?: string; // Physical location in the library
  total_copies?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token?: string;
}

export interface IssuedBook {
  id: string;
  bookId: string;
  book: Book;
  userId: string;
  user?: User;
  issuedDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine?: number;
  renewed_count?: number;
  issued_by?: string;
}

export interface LibraryCardStatus {
  id: string;
  userId: string;
  cardNumber: string;
  issuedDate: string;
  expiryDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  photo?: string;
  issued_by?: string;
  max_books_allowed?: number;
}

export interface LibraryCardApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  course: string;
  semester: number;
  contactNumber: string;
  dateOfBirth: string;
  appliedOn: string;
  status: 'pending' | 'approved' | 'rejected';
  photo?: string;
  address?: string;
  guardian_name?: string;
  guardian_contact?: string;
}

// API related types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status_code?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API resource types from apiService.ts
export interface ApiEbook {
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

export interface ApiNote {
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

export interface ApiQuestionPaper {
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

export interface ApiResourcesResponse {
  ebooks: ApiEbook[];
  notes: ApiNote[];
  question_papers: ApiQuestionPaper[];
}

// Resource type for UI display (normalized from API types)
export interface UnifiedResource {
  id: number;
  title: string;
  description?: string;
  author: string;
  filePath: string;
  course_code: string;
  semester: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  resourceType: 'ebook' | 'note' | 'question_paper';
  subject?: string;
  year?: number;
  examType?: string;
}

// Filter and search types
export interface ResourceFilter {
  course_code?: string;
  semester?: number;
  type?: ResourceType;
  search_query?: string;
  page?: number;
  limit?: number;
}

export interface BookFilter {
  category?: string;
  course_code?: string;
  semester?: number;
  search_query?: string;
  available_only?: boolean;
  page?: number;
  limit?: number;
}