import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import { User as UserIcon, Phone, Mail, BookOpen, Building, GraduationCap, Upload, X } from 'lucide-react';
import { Student } from '../../types';
import LibraryCardDownloader from './LibraryCardDownloader';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Image state for library card

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      if (!user?.user_id) {
        setError("User ID not found");
        return;
      }

      console.log("Fetching profile for user ID:", user.user_id);

      try {
        const response = await api.getUserProfile(user.user_id);
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



  useEffect(() => {
    fetchUserProfile();
  }, [user?.user_id]);

  // Format date helper function

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
              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-blue-600">{profile.role && profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</p>
                <p className="mt-1 text-sm text-gray-500">Library ID: {profile.library_id}</p>
              </div>

              {/* Library Card Download Button */}
              <div className="mt-4 sm:mt-0">
                <LibraryCardDownloader
                  profile={profile}
                />
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
                value={profile.course_name || "Not specified"}
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