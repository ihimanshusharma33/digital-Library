import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import { User as UserIcon, Phone, Mail, BookOpen, Building, Calendar, GraduationCap, Download, CreditCard } from 'lucide-react';
import { Student } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingCard, setDownloadingCard] = useState(false);
  
  // Reference to the library card element
  const libraryCardRef = useRef<HTMLDivElement>(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (!user?.id) {
        setError("User ID not found");
        return;
      }

      console.log("Fetching profile for user ID:", user.id);

      try {
        const response = await api.getUserProfile(user.id);
        console.log("Raw API response:", response);

        if (response && response.status && response.data) {
          console.log('User Profile Data:', response.data);
          setProfile(response.data);
        } else {
          console.error("Invalid response format:", response);
          setError("Failed to fetch profile data");
        }
      } catch (apiError) {
        console.error("API call failed:", apiError);
        setError("API request failed");
      }
    } catch (err) {
      console.error("Error in profile fetch function:", err);
      setError("An error occurred while fetching profile");
    } finally {
      setLoading(false);
    }
  };

  const downloadLibraryCard = async () => {
    if (!profile || !libraryCardRef.current) return;
    
    try {
      setDownloadingCard(true);
      
      // Convert the library card element to canvas
      const canvas = await html2canvas(libraryCardRef.current, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Create a new PDF with card dimensions (standard credit card ratio)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card dimensions in mm
      });
      
      // Add the canvas as image to the PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      
      // Download the PDF
      pdf.save(`IGU_Library_Card_${profile.library_id}.pdf`);
      
      console.log("Library card generated for user ID:", user?.id);
    } catch (error) {
      console.error("Error generating library card:", error);
      alert("Failed to generate library card. Please try again.");
    } finally {
      setDownloadingCard(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.id]);

  // Format date helper function
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.FC<any>, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start space-x-3 p-3 rounded-md bg-white border border-gray-100 shadow-sm">
      <div className="p-2 bg-blue-50 rounded-md">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value || "Not available"}</p>
      </div>
    </div>
  );

  // Calculate the expiry date (1 year from now)
  const currentDate = new Date();
  const expiryDate = new Date(currentDate);
  expiryDate.setFullYear(currentDate.getFullYear() + 1);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
        Student Profile
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : profile ? (
        <div className="space-y-8">
          {/* Profile header with basic info */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0 h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-3xl font-semibold border-2 border-blue-200">
                {profile.name?.charAt(0) || "U"}
              </div>
              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-blue-600">{profile.role && profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</p>
                <p className="mt-1 text-sm text-gray-500">Library ID: {profile.library_id}</p>
              </div>

              {/* Library Card Download Button */}
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={downloadLibraryCard}
                  disabled={downloadingCard}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingCard ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Download Library Card</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Library Card Preview (hidden for PDF generation) */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Library Card Preview</h2>
            
            {/* The actual library card that will be converted to PDF */}
            <div className="mx-auto" style={{ maxWidth: '450px' }}>
              <div 
                ref={libraryCardRef} 
                className="bg-white rounded-lg overflow-hidden shadow-lg border-2 border-blue-200"
                style={{ 
                  width: '100%', 
                  aspectRatio: '1.618 / 1',
                  padding: '1px' // Add a tiny padding to ensure border is captured
                }}
              >
                <div className="relative w-full h-full p-0 m-0">
                  {/* Card Header */}
                  <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-3">
                        <img 
                          src="https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png" 
                          alt="IGU Logo" 
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold">IGU LIBRARY</h3>
                        <p className="text-xs opacity-75">Indira Gandhi University, Rewari</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">LIBRARY CARD</p>
                      <p className="text-xs opacity-75">{profile.library_id}</p>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 flex">
                    {/* Left side - Photo */}
                    <div className="mr-4">
                      <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-md flex items-center justify-center text-3xl font-bold text-gray-400">
                        {profile.name?.charAt(0) || "U"}
                      </div>
                    </div>
                    
                    {/* Right side - Details */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{profile.name}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs flex items-center">
                          <span className="font-medium w-20 inline-block">Course:</span> 
                          <span>{profile.course_code || "N/A"}</span>
                        </p>
                        <p className="text-xs flex items-center">
                          <span className="font-medium w-20 inline-block">Department:</span> 
                          <span>{profile.department || "N/A"}</span>
                        </p>
                        <p className="text-xs flex items-center">
                          <span className="font-medium w-20 inline-block">Roll Number:</span> 
                          <span>{profile.university_roll_number || "N/A"}</span>
                        </p>
                        <p className="text-xs flex items-center">
                          <span className="font-medium w-20 inline-block">Valid Until:</span> 
                          <span>{formatDate(expiryDate.toISOString())}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="bg-gray-50 p-3 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Issue Date: {formatDate(new Date().toISOString())}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 italic">Librarian's Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={Mail}
                label="Email Address"
                value={profile.email}
              />
              <InfoItem
                icon={Phone}
                label="Phone Number"
                value={profile.phone_number || "Not provided"}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Academic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={GraduationCap}
                label="University Roll Number"
                value={profile.university_roll_number || "Not available"}
              />
              <InfoItem
                icon={BookOpen}
                label="Course"
                value={profile.course_code || "Not specified"}
              />
              <InfoItem
                icon={Building}
                label="Department"
                value={profile.department || "Not specified"}
              />

              <InfoItem
                icon={UserIcon}
                label="Library ID"
                value={profile.library_id || "Not assigned"}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          <p>No profile data available</p>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;