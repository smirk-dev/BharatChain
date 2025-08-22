import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Import contexts
import { Web3Provider } from './context/Web3Context';
import { AuthProvider } from './context/AuthContext';

// Import components
import ErrorBoundary from './components/ErrorBoundary';
import CitizenDashboard from './components/Dashboard/CitizenDashboard';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bharatchain_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('bharatchain_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Create dynamic theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#FF6D00', // Saffron
        light: '#FFA726',
        dark: '#E65100',
      },
      secondary: {
        main: '#138808', // Green
        light: '#4CAF50',
        dark: '#087F23',
      },
      background: {
        default: darkMode ? '#0A0A0A' : '#F8FAFC',
        paper: darkMode ? '#1A1A1A' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#E1E5E9' : '#1A2027',
        secondary: darkMode ? '#B2BAC2' : '#5A6572',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            fontWeight: 600,
            padding: '10px 24px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            background: 'linear-gradient(45deg, #FF6D00 30%, #FF8F00 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #E65100 30%, #FF6D00 90%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Web3Provider>
          <AuthProvider>
            <Box 
              sx={{ 
                minHeight: '100vh', 
                bgcolor: 'background.default',
                transition: 'background-color 0.3s ease',
              }}
            >
              <ProtectedRoute>
                <CitizenDashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </ProtectedRoute>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: darkMode ? '#1A1A1A' : '#FFFFFF',
                    color: darkMode ? '#E1E5E9' : '#1A2027',
                    border: `1px solid ${darkMode ? '#333' : '#E0E0E0'}`,
                    borderRadius: '12px',
                    boxShadow: darkMode 
                      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.12)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4CAF50',
                      secondary: darkMode ? '#1A1A1A' : '#FFFFFF',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#F44336',
                      secondary: darkMode ? '#1A1A1A' : '#FFFFFF',
                    },
                  },
                }}
              />
            </Box>
          </AuthProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
