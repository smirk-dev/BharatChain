import { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const createBharatChainTheme = (mode) => {
  const isLight = mode === 'light';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#FF6B35', // Saffron
        light: '#FFA366',
        dark: '#CC4B1A',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#138808', // Green
        light: '#4CAF50',
        dark: '#0D5D05',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? '#F8F9FA' : '#121212',
        paper: isLight ? '#FFFFFF' : '#1E1E1E',
      },
      text: {
        primary: isLight ? '#2C3E50' : '#FFFFFF',
        secondary: isLight ? '#7F8C8D' : '#B0BEC5',
      },
      success: {
        main: '#28A745',
        light: '#5CBB2A',
        dark: '#1E7E34',
      },
      warning: {
        main: '#FFC107',
        light: '#FFD54F',
        dark: '#F57C00',
      },
      error: {
        main: '#DC3545',
        light: '#EF5350',
        dark: '#C62828',
      },
      info: {
        main: '#17A2B8',
        light: '#4FC3F7',
        dark: '#0277BD',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
        color: isLight ? '#2C3E50' : '#FFFFFF',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
            },
          },
          contained: {
            background: isLight ? 
              'linear-gradient(45deg, #FF6B35 30%, #FF8A50 90%)' :
              'linear-gradient(45deg, #FF6B35 30%, #FF8A50 90%)',
            '&:hover': {
              background: isLight ?
                'linear-gradient(45deg, #E55A2B 30%, #E67A40 90%)' :
                'linear-gradient(45deg, #E55A2B 30%, #E67A40 90%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isLight ? 
              '0 4px 20px rgba(0,0,0,0.08)' : 
              '0 4px 20px rgba(0,0,0,0.3)',
            '&:hover': {
              boxShadow: isLight ?
                '0 8px 30px rgba(0,0,0,0.12)' :
                '0 8px 30px rgba(0,0,0,0.4)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#FFFFFF' : '#1E1E1E',
            color: isLight ? '#2C3E50' : '#FFFFFF',
            boxShadow: isLight ? 
              '0 2px 8px rgba(0,0,0,0.1)' : 
              '0 2px 8px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48,
          },
        },
      },
    },
  });
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('bharatchain-theme');
    return savedMode || 'light';
  });

  const theme = createBharatChainTheme(mode);

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('bharatchain-theme', newMode);
  };

  const setLightMode = () => {
    setMode('light');
    localStorage.setItem('bharatchain-theme', 'light');
  };

  const setDarkMode = () => {
    setMode('dark');
    localStorage.setItem('bharatchain-theme', 'dark');
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('bharatchain-theme');
    if (savedMode && savedMode !== mode) {
      setMode(savedMode);
    }
  }, [mode]);

  const value = {
    mode,
    theme,
    toggleMode,
    setLightMode,
    setDarkMode,
    isLight: mode === 'light',
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
