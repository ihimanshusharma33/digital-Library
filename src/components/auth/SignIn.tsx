import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../utils/apiService';
import { LoginResponse, User } from '../../types';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simple validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      // Call the API to authenticate user - send credentials
      const response = await api.post<LoginResponse>('/login', {
        identifier: email,
        password: password
      });

      console.log("Login response:", response); // Add this for debugging
      if (response && response.status) {
        console.log("Login successful:", response); // Add this for debugging
        const { token, user } = response;
        const userData: User = {
          user_id: user.user_id.toString(),
          name: user.name,
          email: user.email,
          role: (user.role && ['student', 'admin', 'librarian'].includes(user.role) ? user.role : 'student') as 'student' | 'admin' | 'librarian',
          createdAt: new Date().toISOString()
        };

        // Store user data and token in auth context
        login(userData, token);

        // Redirect based on role
        if (userData.role === 'admin' || userData.role === 'librarian') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        // Error message from the server or a default message
        setError(response?.message || 'Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data?.message || 'Invalid credentials. Please try again.');
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred while processing your request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <div
            onClick={() => navigate('/')}
            className="flex justify-center mb-3 cursor-pointer">
            <img
              src="https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png"
              alt="Logo"
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Digital Library</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          <form onSubmit={handleSignIn}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or Phone number or Library ID"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Forgot Your Password? <button onClick={() => navigate('/forgot-password')} className="text-blue-600 hover:text-blue-800">Click Here</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;