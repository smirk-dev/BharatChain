import React from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            p: 3 
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              An unexpected error occurred in the application. This might be due to a network issue or a temporary problem.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Typography variant="caption" sx={{ mt: 2, display: 'block', fontFamily: 'monospace' }}>
                Error: {this.state.error.toString()}
              </Typography>
            )}
          </Alert>
          
          <Button 
            variant="contained" 
            startIcon={<Refresh />}
            onClick={this.handleReload}
            size="large"
          >
            Reload Application
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
