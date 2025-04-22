export interface Course {
  id: string;
  name: string;
  code: string;
}

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
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string;
  courseId: string;
  semester?: number; // Making semester optional for notices
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

// Fixed to match the actual category values used in Resource interface
export type ResourceCategory = 'textbooks' | 'notes' | 'questions' | 'notices';

// Auth and User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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
}

export interface IssuedBook {
  id: string;
  bookId: string;
  book: Book;
  userId: string;
  issuedDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine?: number;
}

export interface LibraryCardStatus {
  id: string;
  userId: string;
  cardNumber: string;
  issuedDate: string;
  expiryDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  photo?: string;
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
}