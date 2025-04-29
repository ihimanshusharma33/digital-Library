import React, { useState, useRef } from 'react';
import { X, Loader, Search, FileText, Download, Check } from 'lucide-react';
import { api } from '../../../utils/apiService';
// Removed unused jsPDF import
import { createPortal } from 'react-dom';
import { Student,GenerateNocModalProps, IssuedBook } from '../../../types';


const GenerateNocModal: React.FC<GenerateNocModalProps> = ({ isOpen, onClose }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReturnedAllBooks, setHasReturnedAllBooks] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Reference for the logo image
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Preload the logo image when component mounts
  React.useEffect(() => {
    if (isOpen) {
      const img = new Image();
      img.src = 'https://himachal365.s3.ap-south-1.amazonaws.com/73/Igu-New-Logo-website-1.png';
      img.onload = () => {
        logoRef.current = img;
      };
      img.onerror = () => {
        console.error('Failed to load logo image');
      };
    }
  }, [isOpen]);

  const searchStudentsByLibraryId = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    setError(null);
    setHasReturnedAllBooks(false);
    
    try {
      // Call the API to get issued books by library ID
      const response = await api.getUserIssuedBooks(searchTerm);
      
      if (response && response.status) {
        const data = response.data;
        if (!data || typeof data !== 'object' || !('user' in data && 'total_fine' in data && 'issued_books' in data)) {
          throw new Error('Invalid response structure');
        }
        // Removed unused variable 'userIssuedBooksResponse'
        
        // Check if all books are returned
        const issuedBooks = data.issued_books as IssuedBook[]; // Explicitly assert the type
        const allBooksReturned = issuedBooks.every(book => book.is_returned);
        const hasPendingFine = typeof data.total_fine === 'number' && data.total_fine > 0;
        
        if (allBooksReturned && !hasPendingFine) {
          // If all books are returned and no fines are pending, fetch detailed student info
          setHasReturnedAllBooks(true);
          
          // Create a basic student object from the user data
          const studentBasic: Student = {
            id: (data.user as { id: number }).id.toString(),
            name: (data.user as { name: string }).name,
            library_id: (data.user as { library_id: string }).library_id,
            email: (data.user as { email: string }).email,
            phone_number: 'Not Available',
            department: 'Not Specified',
            university_roll_number: 0,
            course_code: 'Not Specified',
            semester: 0, // Default value for semester
          };
          
          setSelectedStudent(studentBasic);
          
          // Fetch detailed user information
          await fetchUserDetails((data.user as { id: number }).id);
        } else {
          if (!allBooksReturned) {
            setError('Student has books that need to be returned first.');
          } else if (hasPendingFine) {
            setError(`Student has a pending fine of $${data.total_fine} that needs to be paid.`);
          }
        }
      } else {
        setError(response?.message || 'Failed to find student with this library ID.');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setError('Failed to search student. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  
  // Update the fetchUserDetails function to match the actual API response structure
const fetchUserDetails = async (userId: number) => {
  setIsFetchingDetails(true);
  
  try {
    const response = await api.get(`/user/${userId}`) as { status: boolean; data: Student };
    if (response && response.status) {
      const userData = response.data as Student;
      console.log("User details response:", userData);
      setSelectedStudent(userData);
    
    } else {
      setError('Failed to fetch detailed student information.');
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    setError('Failed to fetch detailed student information.');
  } finally {
    setIsFetchingDetails(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateNOC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      // Instead of generating PDF, show printable view
      setShowPrintView(true);
    } catch (error) {
      console.error('Error preparing NOC:', error);
      setError('Failed to prepare NOC. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleBackToDashboard = () => {
    setShowPrintView(false);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchTerm('');
    setGeneratedPdfUrl(null);
    setHasReturnedAllBooks(false);
    setFormData({
      reason: '',
      remarks: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;
  
  // Show print view instead of regular modal
  if (showPrintView && selectedStudent) {
    return createPortal(
      <div className="fixed inset-0 bg-white z-50 p-8 print:p-0">
        <div className="max-w-3xl mx-auto">
          {/* Only show these controls when not printing */}
          <div className="flex justify-between mb-6 print:hidden">
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="inline-block mr-2 h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
          
          {/* NOC Content */}
          <div className="border p-8 rounded-lg print:border-0">
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src="../../../../iguHead.png"
                alt="University Logo"
                className=" w-full mx-auto"
              />
            </div>
            
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold">NO OBJECTION CERTIFICATE</h1>
            </div>
            
            {/* Reference Number and Date */}
            <div className="flex justify-between mb-8">
              <p>Ref No: LIB/NOC/{new Date().getFullYear()}/{selectedStudent.id}</p>
              <p>Date: {new Date(formData.date).toLocaleDateString()}</p>
            </div>
            
            {/* Certificate Body */}
            <div className="mb-8">
              <p className="mb-4">This is to certify that:</p>
              
              <div className="ml-6 mb-6 space-y-2">
                <p className="font-bold text-lg">{selectedStudent.name}</p>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                  {selectedStudent.university_roll_number && selectedStudent.university_roll_number !== 0 && (
                    <p><strong>University Roll Number:</strong><br/> {selectedStudent.university_roll_number}</p>
                  )}
                  
                  <p><strong>Library ID:</strong><br/> {selectedStudent.library_id}</p>
                  
                  {selectedStudent.course_code && selectedStudent.course_code !== 'Not Specified' && (
                    <p><strong>Course:</strong><br/> {selectedStudent.course_code}</p>
                  )}
                  
                  {selectedStudent.department && selectedStudent.department !== 'Not Specified' && (
                    <p><strong>Department:</strong><br/> {selectedStudent.department}</p>
                  )}
                  
                  {selectedStudent.semester && (
                    <p><strong>Semester:</strong><br/> {selectedStudent.semester}</p>
                  )}
                  
                  {selectedStudent.email && (
                    <p><strong>Email:</strong><br/> {selectedStudent.email}</p>
                  )}
                  
                  {selectedStudent.phone_number && selectedStudent.phone_number !== 'Not Available' && (
                    <p><strong>Phone:</strong><br/> {selectedStudent.phone_number}</p>
                  )}
                </div>
              </div>
              
              <p className="mb-4 text-justify">
                has returned all books issued from the University Library and has no outstanding dues. 
                The library has no objection for the issuance of any documents required by the student.
              </p>
              
              {formData.reason && (
                <p className="mb-2"><strong>Reason for NOC:</strong> {formData.reason}</p>
              )}
              
              {formData.remarks && (
                <p><strong>Remarks:</strong> {formData.remarks}</p>
              )}
            </div>
            
            {/* Signature Area */}
            <div className="flex justify-between mt-32">
              <div className="text-center w-40">
                <div className="  pt-2">
                  <img src='data:image/png;base64,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'/>
                  <p>Librarian</p>
                  <p>University Library</p>
                </div>
              </div>
              
              <div className="text-center w-40">
                  <img src='../../../../IGU-seal.png'/>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Generate NOC Certificate</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {generatedPdfUrl ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">NOC Generated Successfully</h3>
                <p className="mt-2 text-sm text-gray-500">
                  The NOC certificate for {selectedStudent?.name} has been generated successfully.
                </p>
                <div className="mt-5 sm:mt-6">
                  <a
                    href={generatedPdfUrl}
                    download={`NOC_${selectedStudent?.library_id}.pdf`}
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download NOC
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateNOC} className="space-y-4">
                {!selectedStudent ? (
                  /* Library ID Search */
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter Student Library ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter student Library ID (e.g. LIB12345)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchStudentsByLibraryId()}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSearching}
                      />
                      <button
                        type="button"
                        onClick={searchStudentsByLibraryId}
                        className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin text-white mr-1" />
                            <span>Searching</span>
                          </>
                        ) : (
                          <span>Search</span>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the student's library ID to check eligibility for NOC
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Student Information Panel */}
                    <div className="mb-4 pb-4 border-b">
                      <div className="flex items-center mb-3">
                        {hasReturnedAllBooks && (
                          <div className="mr-2 flex h-6 w-6 rounded-full bg-green-100 items-center justify-center">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        <h4 className="text-md font-medium">Student Information</h4>
                      </div>
                      
                      {/* Update the Student Information Panel */}
                      <div className="p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <p className="font-medium text-lg">{selectedStudent.name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-600 mt-1">
                              <span>Library ID: {selectedStudent.library_id}</span>
                              {selectedStudent.university_roll_number && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-medium">Roll #: {selectedStudent.university_roll_number}</span>
                                </>
                              )}
                            </div>
                            
                            {selectedStudent.email && 
                              <p className="text-sm text-gray-600 mt-1">{selectedStudent.email}</p>
                            }
                            
                            {isFetchingDetails ? (
                              <div className="flex items-center mt-2">
                                <Loader className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                                <span className="text-sm text-gray-500">Loading details...</span>
                              </div>
                            ) : (
                              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                {selectedStudent.course_code && (
                                  <div className="p-1 bg-blue-50 rounded">
                                    <span className="text-gray-500">Course:</span>{' '}
                                    <span className="font-medium">{selectedStudent.course_code}</span>
                                  </div>
                                )}
                                {selectedStudent.semester !== undefined && (
                                  <div className="p-1 bg-blue-50 rounded">
                                    <span className="text-gray-500">Semester:</span>{' '}
                                    <span className="font-medium">{selectedStudent.semester}</span>
                                  </div>
                                )}
                                {selectedStudent.department && (
                                  <div className="p-1 bg-blue-50 rounded col-span-2">
                                    <span className="text-gray-500">Department:</span>{' '}
                                    <span className="font-medium">{selectedStudent.department}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(null);
                              setHasReturnedAllBooks(false);
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {hasReturnedAllBooks && (
                          <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded border border-green-200 flex items-start">
                            <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                            <span>Student has returned all books and has no pending fines. Eligible for NOC.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NOC Details */}
                    {hasReturnedAllBooks && (
                      <>
                        <div>
                          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                            Reason for NOC *
                          </label>
                          <input
                            type="text"
                            id="reason"
                            name="reason"
                            required
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="e.g. Course Completion, Transfer, etc."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isGenerating}
                          />
                        </div>

                        <div>
                          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
                            Remarks
                          </label>
                          <textarea
                            id="remarks"
                            name="remarks"
                            rows={3}
                            value={formData.remarks}
                            onChange={handleChange}
                            placeholder="Any additional notes or comments"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isGenerating}
                          />
                        </div>

                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Date *
                          </label>
                          <input
                            type="date"
                            id="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isGenerating}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  
                  {selectedStudent && hasReturnedAllBooks && (
                    <button
                      type="submit"
                      className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isGenerating || isFetchingDetails}
                    >
                      {isGenerating && (
                        <Loader className="mr-2 h-4 w-4 animate-spin text-white" />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate NOC'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateNocModal;