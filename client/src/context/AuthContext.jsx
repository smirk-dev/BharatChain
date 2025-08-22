import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('bharatchain_token');
        
        if (storedToken) {
          // Verify token with backend
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${storedToken}`
              }
            }
          );

          if (response.data.success) {
            const { token: newToken, user: userData } = response.data.data;
            setToken(newToken);
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('bharatchain_token', newToken);
            
            // Set default axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('bharatchain_token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('bharatchain_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (authData) => {
    try {
      setLoading(true);
      
      const { token: authToken, user: userData } = authData;
      
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('bharatchain_token', authToken);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      toast.success(`Welcome ${userData.name || 'to BharatChain'}!`);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional)
      if (token) {
        await axios.post(`${API_BASE_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('bharatchain_token');
      
      // Clear axios header
      delete axios.defaults.headers.common['Authorization'];
      
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) return false;

      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('bharatchain_token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Force logout on refresh failure
      return false;
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshToken,
    updateUser,
    // Helper functions
    isRegistered: user?.isRegistered || false,
    isVerified: user?.isVerified || false,
    userAddress: user?.address || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
