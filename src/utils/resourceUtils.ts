import {
  ApiEbook,
  ApiNote, 
  ApiQuestionPaper,
  ApiResourcesResponse, 
  UnifiedResource
} from '../types';

/**
 * Normalizes resources from API format into a unified format for display
 * @param resources The API resources response data
 * @returns Array of normalized unified resources
 */
export const normalizeResources = (resources: ApiResourcesResponse): UnifiedResource[] => {
  const normalized: UnifiedResource[] = [];

  // Process ebooks
  if (resources.ebooks && resources.ebooks.length > 0) {
    const normalizedEbooks = resources.ebooks.map((ebook: ApiEbook): UnifiedResource => ({
      id: ebook.id,
      title: ebook.title,
      description: ebook.description,
      author: ebook.author,
      filePath: ebook.file_path,
      courseCode: ebook.course_code,
      semester: ebook.semester,
      isVerified: ebook.is_verified,
      createdAt: ebook.created_at,
      updatedAt: ebook.updated_at,
      resourceType: 'ebook'
    }));
    normalized.push(...normalizedEbooks);
  }

  // Process notes
  if (resources.notes && resources.notes.length > 0) {
    const normalizedNotes = resources.notes.map((note: ApiNote): UnifiedResource => ({
      id: note.id,
      title: note.title,
      description: note.description,
      author: note.author,
      filePath: note.file_path,
      courseCode: note.course_code,
      semester: note.semester,
      isVerified: note.is_verified,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      resourceType: 'note',
      subject: note.subject
    }));
    normalized.push(...normalizedNotes);
  }

  // Process question papers
  if (resources.question_papers && resources.question_papers.length > 0) {
    const normalizedQuestionPapers = resources.question_papers.map((paper: ApiQuestionPaper): UnifiedResource => ({
      id: paper.id,
      title: paper.title,
      description: paper.description,
      author: '', // Question papers don't have author in API
      filePath: paper.file_path,
      courseCode: paper.course_code,
      semester: paper.semester,
      isVerified: true, // Assuming question papers are always verified
      createdAt: paper.created_at,
      updatedAt: paper.updated_at,
      resourceType: 'question_paper',
      subject: paper.subject,
      examType: paper.exam_type,
      year: paper.year
    }));
    normalized.push(...normalizedQuestionPapers);
  }

  return normalized;
};

/**
 * Sorts resources by creation date (newest first)
 * @param resources Array of unified resources to sort
 * @returns Sorted array of resources
 */
export const sortResourcesByDate = (resources: UnifiedResource[]): UnifiedResource[] => {
  return [...resources].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

/**
 * Filters resources by course code and/or semester
 * @param resources Resources to filter
 * @param courseCode Optional course code filter
 * @param semester Optional semester filter
 * @returns Filtered resources
 */
export const filterResources = (
  resources: UnifiedResource[],
  courseCode?: string,
  semester?: number
): UnifiedResource[] => {
  return resources.filter(resource => {
    const matchesCourse = !courseCode || resource.courseCode === courseCode;
    const matchesSemester = !semester || resource.semester === semester;
    return matchesCourse && matchesSemester;
  });
};