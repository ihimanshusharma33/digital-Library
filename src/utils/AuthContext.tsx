import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useNavigate, Navigate } from 'react-router-dom';

// Create a standalone logout function that can be imported elsewhere
let logoutFn: () => void;

export const setLogoutFunction = (fn: () => void) => {
  logoutFn = fn;
};

export const logout = () => {
  if (logoutFn) {
    logoutFn();
  } else {
    // Fallback if the logout function hasn't been set yet
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    window.location.href = '/signin';
  }
};

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

  // Set the logout function for global use
  useEffect(() => {
    const localLogout = () => {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      navigate('/signin');
    };
    
    setLogoutFunction(localLogout);
  }, [navigate]);

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

  // Add this to the AuthProvider component
  useEffect(() => {
    // Check if there was a force logout
    const checkForceLogout = () => {
      const wasForceLoggedOut = localStorage.getItem('force_logout') === 'true';
      if (wasForceLoggedOut) {
        // Clear the flag
        localStorage.removeItem('force_logout');
        // Update auth state
        setUser(null);
        setIsAuthenticated(false);
        // Redirect to signin page
        window.location.href = '/signin';
      }
    };

    // Run once on mount
    checkForceLogout();

    // Listen for force logout events
    const handleForceLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      // Don't redirect here - wait for the next render cycle
    };

    window.addEventListener('auth:force-logout', handleForceLogout);
    
    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout);
    };
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

  const logout = async () => {
    try {
      // Call logout API if needed
      // await api.post('/auth/logout');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear storage
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('auth_token');
      
      // Don't use window.location.href here as it can cause loops
      // Use history from react-router instead
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
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
  

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  // Allow both admin and staff roles to access admin routes
  if (user?.role !== 'admin' && user?.role !== 'librarian') {
    console.log("User not authorized for admin area:", user?.role);
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};