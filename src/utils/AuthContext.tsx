import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useNavigate, Navigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  // Login method
  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    setIsAuthenticated(true);
    
    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    navigate('/signin');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log("AuthRoute check:", { isAuthenticated, userRole: user?.role });

  if (isAuthenticated) {
    const redirectPath = user?.role === 'admin' ? '/admin' : '/dashboard';
    console.log(`Redirecting authenticated user to: ${redirectPath}`);
    return <Navigate to={redirectPath} />;
  }

  return <>{children}</>;
};

// Add this component alongside your other route components
export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  console.log("StudentRoute check:", { isAuthenticated, userRole: user?.role });

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  // Let both students and admins access student routes (admins often need access to student views)
  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  console.log("AdminRoute check:", { isAuthenticated, userRole: user?.role });

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  // Allow both admin and staff roles to access admin routes
  if (user?.role !== 'admin' && user?.role !== 'staff') {
    console.log("User not authorized for admin area:", user?.role);
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};