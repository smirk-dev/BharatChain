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
    isInitialized,
    disconnectWallet,
    resetConnection,
    error: web3Error,
    clearError
  } = useWeb3();

  const [anchorEl, setAnchorEl] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  // Update year in real-time (checks every minute)
  useEffect(() => {
    const yearUpdateInterval = setInterval(() => {
      const newYear = new Date().getFullYear();
      if (newYear !== currentYear) {
        setCurrentYear(newYear);
      }
    }, 60000); // Check every minute

    return () => clearInterval(yearUpdateInterval);
  }, [currentYear]);

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

  // Loading state with Indian theme - Show during connection or initialization
  if (isConnecting || !isInitialized) {
    const loadingMessage = isConnecting 
      ? 'MetaMask से जुड़ रहा है... • Connecting to MetaMask...'
      : 'BharatChain शुरू हो रहा है... • Initializing BharatChain...';
      
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 33%, #138808 66%)',
          color: '#000080',
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
          <div className="bharat-rangoli"></div>
        </Box>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', zIndex: 2, position: 'relative' }}
        >
          <div className="bharat-chakra" style={{ margin: '0 auto 30px' }}></div>
          <Typography variant="h2" gutterBottom sx={{ 
            fontWeight: 700,
            fontFamily: '"Playfair Display", serif',
            color: '#000080',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}>
            🇮🇳 भारत चेन • BharatChain
          </Typography>
          <Typography variant="h5" gutterBottom sx={{ 
            opacity: 0.8,
            color: '#7B3F00',
            fontWeight: 600,
            mb: 4
          }}>
            {loadingMessage}
          </Typography>
          <div className="bharat-loading" style={{ margin: '0 auto' }}></div>
          <LinearProgress 
            sx={{ 
              mt: 3, 
              width: '300px',
              mx: 'auto',
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)'
              }
            }} 
          />
          <Typography variant="body1" sx={{ 
            mt: 3, 
            fontStyle: 'italic',
            color: '#7B3F00',
            opacity: 0.7
          }}>
            कृपया प्रतीक्षा करें... • Please wait...
          </Typography>
          
          {(isConnecting && !web3Error) && (
            <Button
              variant="outlined"
              onClick={resetConnection}
              sx={{
                mt: 3,
                color: '#7B3F00',
                borderColor: '#7B3F00',
                '&:hover': { 
                  backgroundColor: 'rgba(123, 63, 0, 0.1)',
                  borderColor: '#7B3F00'
                },
                fontWeight: 600
              }}
            >
              कनेक्शन रीसेट करें • Reset if stuck
            </Button>
          )}
          {web3Error && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ 
                color: '#E34234',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '12px 20px',
                borderRadius: '8px',
                maxWidth: '400px',
                mx: 'auto',
                mb: 2
              }}>
                Error: {web3Error}
              </Typography>
              <Button
                variant="contained"
                onClick={resetConnection}
                sx={{
                  backgroundColor: '#FF9933',
                  color: 'white',
                  '&:hover': { backgroundColor: '#E68929' },
                  fontWeight: 600
                }}
              >
                रीसेट करें • Reset Connection
              </Button>
            </Box>
          )}
        </motion.div>
      </Box>
    );
  }

  // Main App UI with Indian heritage theme
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }} className="bharat-container" style={{ margin: 0, borderRadius: 0 }}>
      {/* Indian Heritage App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ 
        background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
        borderBottom: '3px solid #FFD700',
        color: '#000080'
      }}>
        <Toolbar sx={{ py: 1 }}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '2rem', mr: 2 }}>🇮🇳</Typography>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 900, 
                  fontFamily: '"Playfair Display", serif',
                  color: '#000080',
                  lineHeight: 1,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}>
                  भारत चेन
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  color: '#7B3F00',
                  lineHeight: 1,
                  fontSize: '1rem'
                }}>
                  BharatChain
                </Typography>
              </Box>
              <Chip 
                label="डिजिटल भारत • Digital India" 
                size="small" 
                sx={{ 
                  ml: 3, 
                  backgroundColor: 'rgba(255,215,0,0.3)', 
                  color: '#7B3F00',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: '1px solid #FFD700'
                }} 
              />
            </Box>
          </motion.div>

          {isConnected && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <IconButton 
                sx={{ 
                  mr: 2, 
                  color: '#FF9933',
                  backgroundColor: 'rgba(255, 153, 51, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 153, 51, 0.2)' }
                }}
              >
                <NotificationsNone />
              </IconButton>
              
              <Button
                startIcon={<AccountBalanceWallet />}
                onClick={handleMenuOpen}
                sx={{ 
                  color: '#000080',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
                  borderRadius: 5,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  border: '2px solid #FFD700',
                  boxShadow: '0 4px 16px rgba(255, 215, 0, 0.3)'
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
                    minWidth: 220,
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid #FFD700'
                  }
                }}
              >
                <MenuItem onClick={handleMenuClose} sx={{ fontWeight: 600, color: '#7B3F00' }}>
                  <SettingsOutlined sx={{ mr: 2, color: '#FF9933' }} />
                  सेटिंग्स • Settings
                </MenuItem>
                <MenuItem onClick={handleDisconnect} sx={{ color: '#E34234', fontWeight: 600 }}>
                  <PowerSettingsNew sx={{ mr: 2 }} />
                  डिस्कनेक्ट • Disconnect
                </MenuItem>
              </Menu>
            </motion.div>
          )}
        </Toolbar>
      </AppBar>

      {/* Welcome Alert with Indian Theme */}
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
              className="bharat-alert bharat-alert-success"
              sx={{ 
                borderRadius: 0,
                background: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
                '& .MuiAlert-icon': { color: 'white', fontSize: '1.5rem' }
              }}
            >
              🎉 भारत चेन में आपका स्वागत है! • Welcome to BharatChain! Your wallet is now connected and you can access all governance services.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {!isConnected ? (
          // Landing/Authentication Page with Indian Heritage Theme
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section with Traditional Indian Design */}
            <Box
              sx={{
                textAlign: 'center',
                py: 10,
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
                borderRadius: 5,
                color: 'white',
                mb: 6,
                position: 'relative',
                overflow: 'hidden',
                border: '3px solid #FFD700'
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
                <div className="bharat-rangoli"></div>
              </Box>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ position: 'relative', zIndex: 2 }}
              >
                <div className="bharat-chakra" style={{ margin: '0 auto 30px' }}></div>
                <Typography variant="h1" gutterBottom sx={{ 
                  fontWeight: 900,
                  fontFamily: '"Playfair Display", serif',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                  mb: 2
                }}>
                  🇮🇳 भारत चेन में आपका स्वागत है
                </Typography>
                <Typography variant="h3" gutterBottom sx={{ 
                  fontWeight: 700,
                  opacity: 0.95, 
                  maxWidth: 800, 
                  mx: 'auto',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Welcome to BharatChain
                </Typography>
                <Typography variant="h5" gutterBottom sx={{ 
                  opacity: 0.9, 
                  maxWidth: 600, 
                  mx: 'auto',
                  fontWeight: 600,
                  mb: 3
                }}>
                  भारत का पहला ब्लॉकचेन-संचालित डिजिटल गवर्नेंस प्लेटफॉर्म
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ 
                  opacity: 0.85, 
                  maxWidth: 600, 
                  mx: 'auto',
                  fontStyle: 'italic'
                }}>
                  India's First Blockchain-Powered Digital Governance Platform
                </Typography>
                <div className="bharat-decorative-border" style={{ margin: '30px auto', maxWidth: '400px' }}></div>
                <Typography variant="body1" sx={{ 
                  opacity: 0.8, 
                  maxWidth: 900, 
                  mx: 'auto', 
                  mb: 4,
                  fontSize: '1.2rem',
                  lineHeight: 1.6
                }}>
                  सुरक्षित, पारदर्शी और कुशल नागरिक सेवाएं ब्लॉकचेन प्रौद्योगिकी द्वारा संचालित। दस्तावेज़ सत्यापन, शिकायत प्रबंधन और अधिक तक पहुंचने के लिए अपना वॉलेट कनेक्ट करें।
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.75, 
                  maxWidth: 900, 
                  mx: 'auto', 
                  fontStyle: 'italic',
                  fontSize: '1.1rem'
                }}>
                  Secure, transparent, and efficient citizen services powered by blockchain technology. 
                  Connect your wallet to access document verification, grievance management, and more.
                </Typography>
              </motion.div>
            </Box>

            {/* Features Grid with Indian Heritage Design */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
              {[
                {
                  icon: '🔒',
                  title: 'सुरक्षित और पारदर्शी',
                  subtitle: 'Secure & Transparent',
                  description: 'अपरिवर्तनीय सत्यापन के साथ ब्लॉकचेन-आधारित दस्तावेज़ भंडारण',
                  englishDesc: 'Blockchain-based document storage with immutable verification',
                  gradient: 'linear-gradient(135deg, #138808 0%, #50C878 100%)'
                },
                {
                  icon: '⚡',
                  title: 'तेज़ प्रसंस्करण',
                  subtitle: 'Fast Processing',
                  description: 'AI-संचालित दस्तावेज़ विश्लेषण और तुरंत सत्यापन',
                  englishDesc: 'AI-powered document analysis and instant verification',
                  gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                },
                {
                  icon: '✅',
                  title: 'सरकार द्वारा सत्यापित',
                  subtitle: 'Government Verified',
                  description: 'अधिकृत पहुंच के साथ आधिकारिक सरकारी प्लेटफॉर्म',
                  englishDesc: 'Official government platform with authorized access',
                  gradient: 'linear-gradient(135deg, #E49B0F 0%, #FFA500 100%)'
                },
                {
                  icon: '📊',
                  title: 'एकीकृत डैशबोर्ड',
                  subtitle: 'Unified Dashboard',
                  description: 'सभी नागरिक सेवाओं और शिकायतों के लिए एकल प्लेटफॉर्म',
                  englishDesc: 'Single platform for all citizen services and grievances',
                  gradient: 'linear-gradient(135deg, #005A5B 0%, #4169E1 100%)'
                }
              ].map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                  >
                    <Card className="bharat-card bharat-glow" sx={{ 
                      height: '100%', 
                      textAlign: 'center', 
                      p: 3,
                      background: feature.gradient,
                      color: 'white',
                      minHeight: '280px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ 
                          fontSize: '4rem', 
                          mb: 3,
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                        }}>
                          {feature.icon}
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ 
                          fontWeight: 700,
                          fontFamily: '"Playfair Display", serif',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          mb: 1
                        }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="h6" gutterBottom sx={{ 
                          fontWeight: 600,
                          opacity: 0.9,
                          mb: 2
                        }}>
                          {feature.subtitle}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          opacity: 0.85,
                          mb: 2,
                          lineHeight: 1.6
                        }}>
                          {feature.description}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          opacity: 0.75,
                          fontStyle: 'italic',
                          fontSize: '0.9rem'
                        }}>
                          {feature.englishDesc}
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

      {/* Footer with Indian Heritage Design */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 4,
          px: 2,
          background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
          borderTop: '4px solid #FFD700',
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05 }}>
          <div className="bharat-lotus-pattern"></div>
        </Box>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: '2rem', mr: 2 }}>🇮🇳</Typography>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 700,
                    color: '#000080',
                    fontFamily: '"Playfair Display", serif'
                  }}>
                    भारत चेन • BharatChain
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#7B3F00', fontWeight: 600 }}>
                    भारत सरकार की पहल • Government of India Initiative
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: '#7B3F00', fontWeight: 500 }}>
                © {currentYear} BharatChain. सभी अधिकार सुरक्षित • All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography className="bharat-sanskrit" sx={{ mb: 2, fontSize: '1rem' }}>
                सत्यमेव जयते • Truth Alone Triumphs
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#7B3F00',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                ब्लॉकचेन प्रौद्योगिकी द्वारा संचालित • Powered by Blockchain Technology
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
                {['🔒', '🌐', '⚡'].map((emoji, index) => (
                  <Chip 
                    key={index}
                    label={emoji} 
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 215, 0, 0.3)',
                      color: '#7B3F00',
                      fontWeight: 700,
                      border: '1px solid #FFD700'
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
