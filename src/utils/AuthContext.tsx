import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType extends AuthState {
  login: (user: User, token: string) => void;
  user?: { name: string; email: string }; // Add the user property
  getToken: () => string | null;
  isTokenValid: () => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
    
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user and token are stored in localStorage on initial load
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser) as User;
        // Validate token (simplified example - in a real app, you might verify with your backend)
        const isValid = validateToken(storedToken);
        
        if (isValid) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          // Token is invalid or expired
          handleInvalidSession('Your session has expired. Please sign in again.');
        }
      } catch (error) {
        console.error('Error parsing stored user', error);
        handleInvalidSession('Session expired. Please sign in again.');
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  // Simple token validation function
  const validateToken = (token: string): boolean => {
    // In a real application, you would verify the token's signature, expiration, etc.
    // For this example, we'll just check if it exists and isn't empty
    return !!token && token.length > 10;
  };
  
  const handleInvalidSession = (errorMessage: string) => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: errorMessage
    });
  };

  const login = (user: User, token: string) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
    
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    navigate('/signin');
  };
  
  const getToken = (): string | null => {
    return localStorage.getItem('authToken');
  };
  
  const isTokenValid = (): boolean => {
    const token = getToken();
    return token ? validateToken(token) : false;
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout, 
      getToken,
      isTokenValid 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};