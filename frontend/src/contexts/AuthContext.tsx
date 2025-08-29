import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { config } from '../config';

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
        // Check localStorage for cached user data
        const storedUser = localStorage.getItem('coralbricks_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Found cached user data:', userData);
          setUser(userData);
        } else {
          console.log('No cached user data found');
        }
        
        // Note: Backend validation will happen when the user actually uses the app
        // This prevents unnecessary API calls during initial load
        
      } catch (error) {
        console.error('Error checking auth status:', error);
        // On error, clear any cached user data to be safe
        localStorage.removeItem('coralbricks_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Call your backend API for signup
      const response = await fetch(`${config.backendApiUrl}/login/signup`, {
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
      const response = await fetch(`${config.backendApiUrl}/login`, {
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