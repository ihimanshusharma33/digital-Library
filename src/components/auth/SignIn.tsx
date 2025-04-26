import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { useAuth } from '../../utils/AuthContext';

// Mock user data for demo purposes
const mockUsers = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@library.com',
    password: 'admin123@321_4gdfh3',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Student User',
    email: 'student@library.com',
    password: 'student123',
    role: 'student',
    createdAt: new Date().toISOString()
  }
];

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Display auth error from context if available
  const displayError = error;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Mock authentication
    setTimeout(() => {
      const user = mockUsers.find(
        user => user.email === email && user.password === password
      );

      if (user) {
        // Remove password before storing
        const { password, ...secureUser } = user;
        
        // Generate a mock token
        const mockToken = generateMockToken(secureUser);
        
        // Update auth context with user and token
        login(secureUser as User, mockToken);
        
        // Redirect based on role
        if (secureUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
    }, 800);
  };

  // Generate a mock token for demonstration purposes
  const generateMockToken = (user: Omit<typeof mockUsers[0], 'password'>): string => {
    // In a real app, the token would come from your authentication server
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
    };
    
    // This is NOT a secure way to generate tokens, just for demonstration
    return `mock_token_${btoa(JSON.stringify(payload))}_${Date.now()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <BookOpen className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Digital Library</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          <form onSubmit={handleSignIn}>
            {displayError && (
              <div className="bg-red-50 text-red-800 rounded-md p-3 mb-4 text-sm">
                {displayError}
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
                placeholder="admin@library.com or student@library.com"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                placeholder="admin123 or student123"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">Don't have an account? <button onClick={() => navigate('/signup')} className="text-blue-600 hover:text-blue-800">Sign up</button></p>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            For demo: Admin (admin@library.com / admin123) or Student (student@library.com / student123)
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;