import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Documents from './pages/Documents/Documents';
import Grievances from './pages/Grievances/Grievances';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Context
import { Web3Provider } from './context/Web3Context';
import { AuthProvider } from './context/AuthContext';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF9933', // Saffron
      dark: '#FF6600',
    },
    secondary: {
      main: '#138808', // Green
      dark: '#0F6B06',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8F9FA',
    },
    text: {
      primary: '#000080', // Navy Blue
    },
  },
  typography: {
    fontFamily: '"Roboto", "Noto Sans Devanagari", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        // Any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        setLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Web3Provider>
          <Router>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
              }}
            >
              <Navbar />
              
              <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/grievances" element={<Grievances />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Box>
              
              <Footer />
            </Box>
          </Router>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
