import { Course, Resource, Notice } from '../types';

export const courses: Course[] = [
  { id: '1', name: 'Computer Science Engineering', code: 'CSE' },
  { id: '2', name: 'Electronics & Communication', code: 'ECE' },
  { id: '3', name: 'Mechanical Engineering', code: 'ME' },
  { id: '4', name: 'Civil Engineering', code: 'CE' },
  { id: '5', name: 'Business Administration', code: 'BBA' },
  { id: '6', name: 'Commerce', code: 'BCOM' },
  { id: '7', name: 'Arts & Humanities', code: 'BA' },
  { id: '8', name: 'Information Technology', code: 'IT' },
];

// Maximum number of semesters for filtering
export const MAX_SEMESTERS = 8;

export const resources: Resource[] = [
  {
    id: '1',
    title: 'Introduction to Algorithms',
    uploadedBy: 'Prof. Thomas H. Cormen',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'textbook',
    uploadDate: '2023-01-15',
    description: 'Comprehensive introduction to algorithms and data structures.',
    semester: 3
  },
  {
    id: '2',
    title: 'Operating Systems Concepts',
    uploadedBy: 'Prof. Abraham Silberschatz',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'textbook',
    uploadDate: '2023-02-10',
    description: 'Core concepts of modern operating systems.',
    semester: 5
  },
  {
    id: '3',
    title: 'Data Structures Notes',
    uploadedBy: 'Ananya Singh',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'notes',
    uploadDate: '2023-03-22',
    description: 'Comprehensive notes on data structures covered in class.',
    semester: 3
  },
  {
    id: '4',
    title: 'Computer Networks Summary',
    uploadedBy: 'Rahul Kumar',
    fileType: 'doc',
    url: '#',
    courseId: '1',
    category: 'notes',
    uploadDate: '2023-04-05',
    description: 'Detailed summary of all networking protocols and concepts.',
    semester: 6
  },
  {
    id: '5',
    title: 'Database Management Questions 2022',
    uploadedBy: 'Prof. Sunil Mehta',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'questions',
    uploadDate: '2023-05-12',
    description: 'Previous year question paper for Database Management Systems.',
    semester: 4
  },
  {
    id: '6',
    title: 'Compiler Design Midterm 2023',
    uploadedBy: 'Department of CSE',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'questions',
    uploadDate: '2023-06-18',
    description: 'Midterm questions for Compiler Design course.',
    semester: 7
  },
  {
    id: '7',
    title: 'Digital Signal Processing',
    uploadedBy: 'Prof. John Proakis',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'textbook',
    uploadDate: '2023-01-20',
    description: 'Comprehensive textbook on digital signal processing.',
    semester: 4
  },
  {
    id: '8',
    title: 'Communication Systems',
    uploadedBy: 'Prof. Simon Haykin',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'textbook',
    uploadDate: '2023-02-15',
    description: 'Textbook covering fundamentals of communication systems.',
    semester: 5
  },
  {
    id: '9',
    title: 'Analog Circuits Notes',
    uploadedBy: 'Priya Sharma',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'notes',
    uploadDate: '2023-03-25',
    description: 'Detailed notes on analog circuit design.',
    semester: 3
  },
  {
    id: '10',
    title: 'VLSI Design Handwritten Notes',
    uploadedBy: 'Vikram Desai',
    fileType: 'image',
    url: '#',
    courseId: '2',
    category: 'notes',
    uploadDate: '2023-04-10',
    description: 'Comprehensive handwritten notes for VLSI Design course.',
    semester: 7
  },
  {
    id: '11',
    title: 'Microprocessors Questions 2022',
    uploadedBy: 'Prof. Anita Gupta',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'questions',
    uploadDate: '2023-05-18',
    description: 'Previous year questions for Microprocessors course.',
    semester: 4
  },
  {
    id: '12',
    title: 'Control Systems Quiz Collection',
    uploadedBy: 'Department of ECE',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'questions',
    uploadDate: '2023-06-22',
    description: 'Collection of quizzes from previous years for Control Systems.',
    semester: 6
  },
  // Adding more resources for different semesters
  {
    id: '13',
    title: 'Introduction to Programming',
    uploadedBy: 'Prof. James Smith',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'textbook',
    uploadDate: '2023-02-10',
    description: 'Basic programming concepts for beginners.',
    semester: 1
  },
  {
    id: '14',
    title: 'Discrete Mathematics',
    uploadedBy: 'Prof. Lisa Chen',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'textbook',
    uploadDate: '2023-01-20',
    description: 'Fundamentals of discrete mathematics and logic.',
    semester: 2
  },
  {
    id: '15',
    title: 'Advanced Database Systems',
    uploadedBy: 'Prof. Maria Rodriguez',
    fileType: 'pdf',
    url: '#',
    courseId: '1',
    category: 'textbook',
    uploadDate: '2023-03-15',
    description: 'Advanced concepts in database management and design.',
    semester: 8
  },
  {
    id: '16',
    title: 'Circuit Theory Basics',
    uploadedBy: 'Prof. David Lim',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'textbook',
    uploadDate: '2023-01-18',
    description: 'Introduction to electrical circuit theory.',
    semester: 1
  },
  {
    id: '17',
    title: 'Electronic Devices',
    uploadedBy: 'Prof. Sarah Johnson',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'textbook',
    uploadDate: '2023-02-12',
    description: 'Understanding electronic devices and components.',
    semester: 2
  },
  {
    id: '18',
    title: 'Wireless Communication',
    uploadedBy: 'Prof. Michael Brown',
    fileType: 'pdf',
    url: '#',
    courseId: '2',
    category: 'textbook',
    uploadDate: '2023-03-22',
    description: 'Advanced wireless communication technologies.',
    semester: 8
  }
];

export const notices: Notice[] = [
  {
    id: '1',
    title: 'Mid-Semester Examination Schedule',
    description: 'The mid-semester examinations for all courses will commence from 15th October 2023. Please check the detailed schedule attached.',
    date: '2023-09-30',
    courseId: '1',
    semester: 5,
    attachment: {
      name: 'exam_schedule.pdf',
      url: '#',
      type: 'pdf'
    }
  },
  {
    id: '2',
    title: 'Workshop on Advanced Algorithms',
    description: 'A two-day workshop on Advanced Algorithms will be conducted by Prof. Jones from MIT on 5th-6th November 2023. Registration is mandatory.',
    date: '2023-10-15',
    courseId: '1',
    semester: 3
  },
  {
    id: '3',
    title: 'Submission Deadline Extension',
    description: 'The deadline for submitting the Data Structures project has been extended to 12th November 2023.',
    date: '2023-10-28',
    courseId: '1',
    semester: 3
  },
  {
    id: '4',
    title: 'Guest Lecture on AI Ethics',
    description: 'A guest lecture on Ethics in Artificial Intelligence will be delivered by Dr. Emily Watson on 20th November 2023 at the Main Auditorium.',
    date: '2023-11-05',
    courseId: '1',
    semester: 7
  },
  {
    id: '5',
    title: 'Electronics Lab Equipment Update',
    description: 'New oscilloscopes and function generators have been installed in Lab 3. Students can use them from 10th October onwards.',
    date: '2023-09-28',
    courseId: '2',
    semester: 4,
    attachment: {
      name: 'equipment_guidelines.pdf',
      url: '#',
      type: 'pdf'
    }
  },
  {
    id: '6',
    title: 'VLSI Design Contest',
    description: 'The department is organizing a VLSI Design Contest on 25th November 2023. Interested students can register by 15th November.',
    date: '2023-10-20',
    courseId: '2',
    semester: 7
  },
  {
    id: '7',
    title: 'Project Presentation Schedule',
    description: 'Schedule for Communication Systems project presentations is now available. Presentations will be held from 5th-7th December 2023.',
    date: '2023-11-10',
    courseId: '2',
    semester: 5,
    attachment: {
      name: 'presentation_schedule.pdf',
      url: '#',
      type: 'pdf'
    }
  },
  {
    id: '8',
    title: 'Required Textbooks Update',
    description: 'Updated list of required textbooks for the next semester is now available in the library.',
    date: '2023-11-25',
    courseId: '2'
  }
];

export const getResourcesByCategory = (courseId: string, category: string, semester?: number) => {
  let filtered = resources.filter(
    resource => resource.courseId === courseId && resource.category === category
  );
  
  if (semester !== undefined) {
    filtered = filtered.filter(resource => resource.semester === semester);
  }
  
  return filtered;
};

export const getNoticesByCourse = (courseId: string, semester?: number) => {
  let filtered = notices.filter(notice => notice.courseId === courseId);
  
  if (semester !== undefined) {
    filtered = filtered.filter(notice => notice.semester === semester);
  }
  
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Mock data for books
export const books: Book[] = [
  {
    id: '1',
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    category: 'Computer Science',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    availableCopies: 3
  },
  {
    id: '2',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Computer Science',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    availableCopies: 1
  },
  {
    id: '3',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '978-0262033848',
    category: 'Computer Science',
    coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    availableCopies: 2
  },
  {
    id: '4',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    isbn: '978-0134610993',
    category: 'Computer Science',
    coverImage: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    availableCopies: 0
  },
  {
    id: '5',
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
    isbn: '978-0073523323',
    category: 'Computer Science',
    coverImage: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    availableCopies: 5
  },
];

// Mock data for issued books
import { IssuedBook } from '../types';

export const issuedBooks: IssuedBook[] = [
  {
    id: '1',
    bookId: '1',
    book: books[0],
    userId: '1',
    issuedDate: '2025-03-15',
    dueDate: '2025-04-15',
    status: 'issued'
  },
  {
    id: '2',
    bookId: '2',
    book: books[1],
    userId: '1',
    issuedDate: '2025-03-20',
    dueDate: '2025-04-20',
    status: 'issued'
  },
  {
    id: '3',
    bookId: '3',
    book: books[2],
    userId: '1',
    issuedDate: '2025-02-10',
    dueDate: '2025-03-10',
    status: 'overdue',
    fine: 50
  },
  {
    id: '4',
    bookId: '5',
    book: books[4],
    userId: '1',
    issuedDate: '2025-01-05',
    dueDate: '2025-02-05',
    returnDate: '2025-01-30',
    status: 'returned'
  }
];

// Mock data for library card status
export const libraryCardStatus: LibraryCardStatus = {
  id: '1',
  userId: '1',
  cardNumber: 'LIB-2025-001',
  issuedDate: '2025-01-15',
  expiryDate: '2025-12-31',
  status: 'approved',
  photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

export const pendingLibraryCardStatus: LibraryCardStatus = {
  id: '2',
  userId: '2',
  cardNumber: '',
  issuedDate: '',
  expiryDate: '',
  status: 'pending',
  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
};

// Mock function for getting library card status for a user
export const getLibraryCardStatus = (userId: string) => {
  if (userId === '1') {
    return libraryCardStatus;
  } else if (userId === '2') {
    return pendingLibraryCardStatus;
  }
  return null;
};

// Mock function for getting issued books for a user
export const getIssuedBooks = (userId: string) => {
  return issuedBooks.filter(book => book.userId === userId);
};

// Mock function for applying for a library card
export const applyForLibraryCard = (applicationData: Omit<LibraryCardApplication, 'id' | 'appliedOn' | 'status'>) => {
  const newApplication: LibraryCardApplication = {
    ...applicationData,
    id: Math.random().toString(36).substring(2, 9),
    appliedOn: new Date().toISOString().split('T')[0],
    status: 'pending'
  };
  
  // In a real application, this would be saved to a database
  // For now, we'll just return the new application
  return newApplication;
};