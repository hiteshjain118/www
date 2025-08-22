import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Check localStorage for saved user data
        const savedUser = localStorage.getItem('coralbricks_user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('Found saved user in localStorage:', userData);
            setUser(userData);
          } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('coralbricks_user');
          }
        } else {
          console.log('No saved user found in localStorage');
        }
        
        // TODO: Verify with backend if needed
        // Try to get current user from backend
        // const response = await fetch('http://localhost:3001/auth/me', {
        //   method: 'GET',
        //   credentials: 'include', // Include cookies
        // });
        
        // if (response.ok) {
        //   const data = await response.json();
        //   console.log('User is authenticated:', data);
        //   if (data.user) {
        //     setUser(data.user);
        //   }
        // } else {
        //   console.log('User is not authenticated');
        // }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Call your backend API for signup
      const response = await fetch('http://localhost:3001/login/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.error || 'Signup failed' } };
      }
      
      // Set user from backend response (only if fully authenticated)
      if (data.user && data.user.role !== 'pending_verification') {
        setUser(data.user);
        // Save user data to localStorage
        localStorage.setItem('coralbricks_user', JSON.stringify(data.user));
      }
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Network error' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Call your backend API
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.error || 'Signin failed' } };
      }
      
      // Set user from backend response
      if (data.user) {
        setUser(data.user);
        // Save user data to localStorage
        localStorage.setItem('coralbricks_user', JSON.stringify(data.user));
      }
      
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Network error' } };
    }
  };

  const signOut = async () => {
    try {
      // Since there's no backend signout endpoint, just clear local state
      setUser(null);
      localStorage.removeItem('coralbricks_user');
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  // Helper function to clear auth state and force fresh login
  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('coralbricks_user');
    console.log('Auth state cleared');
  };

  const resetPassword = async (email: string) => {
    try {
      // TODO: Implement password reset when backend endpoint is available
      console.log('Password reset requested for:', email);
      return { error: { message: 'Password reset not implemented yet' } };
    } catch (error: any) {
      return { error: { message: error.message || 'Password reset failed' } };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 