import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, LoginResponse, apiClient } from '../services/api';
import { locationStorage } from '../utils/locationStorage';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  signUp: (userData: {
    name: string;
    email: string;
    password: string;
    accountType: 'donor' | 'receiver' | 'admin';
    phoneNumber?: string;
  }) => Promise<LoginResponse>;
  verifyEmailAndLogin: (email: string, otp: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_userVersion, setUserVersion] = useState(0); // Add version tracking

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userProfile');
      
      if (token && userData) {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userProfile');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('userProfile', JSON.stringify(response.user));
      
      if (response.user.emailVerified) {
        setUser(response.user);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signUp = async (userData: {
    name: string;
    email: string;
    password: string;
    accountType: 'donor' | 'receiver' | 'admin';
    phoneNumber?: string;
  }) => {
    try {
      console.log('Attempting signup with data:', { ...userData, password: '[HIDDEN]' });
      const response = await apiClient.signUp(userData);
      
      // Don't automatically log in - user needs to verify email first
      // Return the response so the UI can handle the OTP flow
      return response;
    } catch (error: any) {
      console.error('Signup error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw new Error(error.response?.data?.message || error.message || 'Sign up failed');
    }
  };

  const verifyEmailAndLogin = async (email: string, otp: string, password?: string) => {
    try {
      await apiClient.verifyEmail(email, otp);
      
      // After email verification, log in the user if password is provided
      if (password) {
        const loginResponse = await apiClient.login({ email, password });
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', loginResponse.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(loginResponse.user));
        
        setUser(loginResponse.user);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Email verification failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userProfile');
      // Also clear local coordinates when logging out
      await locationStorage.clearUserCoordinates();
      setUser(null);
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    try {
      console.log('🔍 AuthContext - Updating user with:', userData);
      console.log('🔍 AuthContext - Current user before update:', JSON.stringify(user, null, 2));
      
      if (!user) {
        console.error('🔍 AuthContext - No user available for update');
        throw new Error('No user logged in');
      }
      
      console.log('🔍 AuthContext - Making API call to update profile...');
      const updatedUser = await apiClient.updateProfile(userData);
      console.log('🔍 AuthContext - API returned:', JSON.stringify(updatedUser, null, 2));
      
      // Also fetch current user to ensure we have the latest data
      console.log('🔍 AuthContext - Fetching latest user data...');
      const currentUser = await apiClient.getCurrentUser();
      console.log('🔍 AuthContext - Current user after update:', JSON.stringify(currentUser, null, 2));
      
      console.log('🔍 AuthContext - Saving updated user to AsyncStorage...');
      await AsyncStorage.setItem('userProfile', JSON.stringify(currentUser));
      
      // Force a new object reference and increment version to trigger re-render
      console.log('🔍 AuthContext - Updating state with new user data...');
      setUser({ ...currentUser, timestamp: Date.now() } as UserProfile);
      setUserVersion(prev => prev + 1);
      
      console.log('✅ AuthContext - User state updated successfully with new version');
    } catch (error: any) {
      console.error('❌ AuthContext - Update user error:', error);
      console.error('❌ AuthContext - Error response:', error.response?.data);
      console.error('❌ AuthContext - Error status:', error.response?.status);
      console.error('❌ AuthContext - Error message:', error.message);
      
      // Don't clear user data on update errors - just throw the error
      if (error.response?.status === 401) {
        console.log('🔍 AuthContext - 401 during update, but user should still be logged in');
      }
      
      // Check if user is still in AsyncStorage after the error
      try {
        const storedUser = await AsyncStorage.getItem('userProfile');
        console.log('🔍 AuthContext - User still in storage after error:', !!storedUser);
      } catch (storageError) {
        console.error('❌ AuthContext - Error checking AsyncStorage:', storageError);
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signUp,
    verifyEmailAndLogin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
