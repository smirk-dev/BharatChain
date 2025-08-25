import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  Dashboard as DashboardIcon,
  Security,
  Speed,
  Verified,
  NotificationsNone,
  SettingsOutlined,
  PowerSettingsNew
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

import { useWeb3 } from './context/Web3Context';
import CitizenDashboard from './components/Dashboard/CitizenDashboard';
import AuthForm from './components/Dashboard/AuthForm';
import './App.css';
import './styles/BharatTheme.css';

function App() {
  const { 
    account, 
    isConnected, 
    isConnecting, 
    disconnectWallet,
    error: web3Error,
    clearError
  } = useWeb3();

  const [anchorEl, setAnchorEl] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome message when first connected
  useEffect(() => {
    if (isConnected && account) {
      setShowWelcome(true);
      toast.success(`Welcome to BharatChain! Connected to ${account.slice(0, 6)}...${account.slice(-4)}`, {
        icon: '🎉'
      });
      
      // Hide welcome message after 3 seconds
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, [isConnected, account]);

  // Handle Web3 errors
  useEffect(() => {
    if (web3Error) {
      toast.error(web3Error);
      clearError();
    }
  }, [web3Error, clearError]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast.info('Wallet disconnected successfully');
      handleMenuClose();
    } catch (error) {
      toast.error('Failed to disconnect wallet');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Loading state
  if (isConnecting) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            🇮🇳 BharatChain
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ opacity: 0.9 }}>
            Connecting to MetaMask...
          </Typography>
          <LinearProgress 
            sx={{ 
              mt: 2, 
              width: 300,
              backgroundColor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white'
              }
            }} 
          />
        </motion.div>
      </Box>
    );
  }

  // Main App UI
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ 
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Toolbar>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              🇮🇳 BharatChain
              <Chip 
                label="Beta" 
                size="small" 
                sx={{ 
                  ml: 1, 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontSize: '0.7rem'
                }} 
              />
            </Typography>
          </motion.div>

          {isConnected && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <NotificationsNone />
              </IconButton>
              
              <Button
                startIcon={<AccountBalanceWallet />}
                onClick={handleMenuOpen}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {formatAddress(account)}
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <SettingsOutlined sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <MenuItem onClick={handleDisconnect} sx={{ color: 'error.main' }}>
                  <PowerSettingsNew sx={{ mr: 1 }} />
                  Disconnect
                </MenuItem>
              </Menu>
            </motion.div>
          )}
        </Toolbar>
      </AppBar>

      {/* Welcome Alert */}
      <AnimatePresence>
        {showWelcome && isConnected && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: 0,
                backgroundColor: '#4caf50',
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' }
              }}
            >
              🎉 Welcome to BharatChain! Your wallet is now connected and you can access all governance services.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {!isConnected ? (
          // Landing/Authentication Page
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section */}
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                borderRadius: 3,
                color: 'white',
                mb: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
                  🇮🇳 Welcome to BharatChain
                </Typography>
                <Typography variant="h5" gutterBottom sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
                  India's First Blockchain-Powered Digital Governance Platform
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 800, mx: 'auto', mb: 4 }}>
                  Secure, transparent, and efficient citizen services powered by blockchain technology. 
                  Connect your wallet to access document verification, grievance management, and more.
                </Typography>
              </motion.div>
            </Box>

            {/* Features Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  icon: <Security sx={{ fontSize: 40 }} />,
                  title: 'Secure & Transparent',
                  description: 'Blockchain-based document storage with immutable verification'
                },
                {
                  icon: <Speed sx={{ fontSize: 40 }} />,
                  title: 'Fast Processing',
                  description: 'AI-powered document analysis and instant verification'
                },
                {
                  icon: <Verified sx={{ fontSize: 40 }} />,
                  title: 'Government Verified',
                  description: 'Official government platform with authorized access'
                },
                {
                  icon: <DashboardIcon sx={{ fontSize: 40 }} />,
                  title: 'Unified Dashboard',
                  description: 'Single platform for all citizen services and grievances'
                }
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                      <CardContent>
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Authentication Component */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AuthForm />
            </motion.div>
          </motion.div>
        ) : (
          // Dashboard (User is connected)
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CitizenDashboard />
          </motion.div>
        )}
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 3,
          px: 2,
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                © 2024 BharatChain. Government of India Initiative. All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Powered by Blockchain Technology | Secure • Transparent • Efficient
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
