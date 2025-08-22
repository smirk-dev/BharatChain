import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AuthForm from './Dashboard/AuthForm';

const ProtectedRoute = ({ children, requireRegistration = false }) => {
  const { isAuthenticated, loading, user, login } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading BharatChain...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return (
      <AuthForm 
        onSubmit={async (authData) => {
          if (authData.success) {
            await login(authData);
          }
        }} 
        type="login" 
      />
    );
  }

  // If authenticated but registration required and user not registered
  if (requireRegistration && !user?.isRegistered) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          Registration Required
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          You need to register as a citizen to access this feature.
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Please complete your citizen registration first.
        </Typography>
      </Box>
    );
  }

  // User is authenticated (and registered if required), render children
  return children;
};

export default ProtectedRoute;
