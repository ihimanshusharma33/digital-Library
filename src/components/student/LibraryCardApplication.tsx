import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Camera, Upload, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { getLibraryCardStatus, applyForLibraryCard } from '../../utils/mockData';
import { LibraryCardStatus } from '../../types';
import html2canvas from 'html2canvas';
import Barcode from 'react-barcode';

const LibraryCardApplication: React.FC = () => {
  const { user } = useAuth();
  const [libraryCard, setLibraryCard] = useState<LibraryCardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [downloadingCard, setDownloadingCard] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    enrollmentNumber: '',
    course: '',
    semester: 1,
    contactNumber: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    // In a real app, this would be an API call
    if (user) {
      const cardStatus = getLibraryCardStatus(user.id);      
      setLibraryCard(cardStatus);
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photo) {
      alert('Please upload a photo for your library card');
      return;
    }
    
    setIsApplying(true);
    
    // In a real app, this would be an API call
    setTimeout(() => {
      const newApplication = applyForLibraryCard({
        ...formData,
        userId: user?.id || '',
        photo,
      });
      
      // Update the library card status to pending
      setLibraryCard({
        id: newApplication.id,
        userId: newApplication.userId,
        cardNumber: '',
        issuedDate: '',
        expiryDate: '',
        status: 'pending',
        photo,
      });
      
      setIsApplying(false);
    }, 1500); // Simulate API delay
  };

  const downloadLibraryCard = async () => {
    if (!libraryCard || libraryCard.status !== 'approved') return;
    
    const cardElement = document.getElementById('library-card');
    if (!cardElement) return;
    
    setDownloadingCard(true);
    
    try {
      const canvas = await html2canvas(cardElement);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `library-card-${libraryCard.cardNumber}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
    } finally {
      setDownloadingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Library Card</h1>
        <p className="text-gray-600">Apply for or view your library card</p>
      </div>

      {libraryCard ? (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          {libraryCard.status === 'approved' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-800 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Your Library Card
                </h2>
                <button
                  onClick={downloadLibraryCard}
                  disabled={downloadingCard}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {downloadingCard ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Card
                    </>
                  )}
                </button>
              </div>

              <div 
                id="library-card" 
                className="bg-white border rounded-lg overflow-hidden shadow-md max-w-md mx-auto"
              >
                <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 mr-2" />
                    <h3 className="text-lg font-bold">Digital Library</h3>
                  </div>
                  <div className="text-sm">ID: {libraryCard.cardNumber}</div>
                </div>

                <div className="p-4">
                  <div className="flex">
                    <div className="w-24 h-28 bg-gray-100 rounded overflow-hidden mr-4 flex-shrink-0">
                      {libraryCard.photo && (
                        <img
                          src={libraryCard.photo}
                          alt="Student"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="font-medium">{user?.name}</div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm">{user?.email}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Issued Date</div>
                          <div className="text-sm">{libraryCard.issuedDate}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Valid Until</div>
                          <div className="text-sm">{libraryCard.expiryDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barcode Section */}
                  <div className="mt-4 pt-4 border-t flex flex-col items-center">
                    <Barcode 
                      value={libraryCard.cardNumber} 
                      width={1.5}
                      height={40}
                      fontSize={12}
                      marginTop={10}
                    />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex justify-between">
                    <div>University Digital Library System</div>
                    <div>Valid For All Library Services</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Application Pending</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your library card application is being processed. We'll notify you once it's approved. This usually takes 1-2 business days.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium text-gray-800 mb-6">Apply for Library Card</h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Number
                </label>
                <input
                  type="text"
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <input
                  type="text"
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Photo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-28 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50">
                    {photo ? (
                      <img src={photo} alt="Uploaded" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <Camera className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <label htmlFor="photo" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose photo
                      <input
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF, max 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isApplying}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {isApplying ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LibraryCardApplication;