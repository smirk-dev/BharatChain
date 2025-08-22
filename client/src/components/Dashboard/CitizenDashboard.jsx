import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from '@mui/material';
import {
  Refresh,
  Add,
  Person,
  Description,
  ReportProblem,
  DashboardOutlined,
  FileUpload,
  CheckCircle,
  Pending,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import contexts
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';

// Import new components
import Header from '../Layout/Header';
import DashboardOverview from './DashboardOverview';
import ProfileSection from './ProfileSection';
import CitizenRegistrationModal from './CitizenRegistrationModal';

// Import API functions
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Utility function to clean wallet addresses and prevent ENS resolution issues
const cleanWalletAddress = (address) => {
  if (!address) return '';
  
  // Remove all non-visible characters, whitespace, and normalize
  const cleaned = address
    .toString()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/\s/g, '') // Remove all whitespace
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .toLowerCase()
    .trim();
  
  // Validate it's a proper Ethereum address format
  if (!/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    console.warn('Invalid address format:', cleaned);
    return '';
  }
  
  return cleaned;
};

const MotionContainer = motion(Container);
const MotionBox = motion(Box);

const CitizenDashboard = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  
  // Handle missing contexts gracefully
  let auth = null;
  let web3 = null;
  
  try {
    auth = useAuth();
  } catch (error) {
    console.log('Auth context not available:', error);
    auth = {
      user: null,
      logout: () => {},
      isRegistered: false,
      isVerified: false,
      userAddress: null
    };
  }

  try {
    web3 = useWeb3();
  } catch (error) {
    console.log('Web3 context not available:', error);
    web3 = {
      account: null,
      isConnected: false,
      connectWallet: async () => ({ success: false, error: 'Web3 not available' }),
      disconnectWallet: () => {}
    };
  }

  const { user, logout, isRegistered, isVerified, userAddress } = auth;
  const { account, isConnected, connectWallet, disconnectWallet } = web3;

  // State for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // Check for stored authentication
  useEffect(() => {
    const storedToken = localStorage.getItem('bharatchain_token');
    if (storedToken) {
      setAuthToken(storedToken);
      setIsAuthenticated(true);
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  // Wallet authentication function
  const authenticateWallet = async () => {
    try {
      if (!isConnected || !account) {
        const result = await connectWallet();
        if (!result?.success) {
          throw new Error('Please connect your wallet first');
        }
      }

      setLoading(true);
      
      // Clean the wallet address to prevent ENS issues
      const cleanAddress = cleanWalletAddress(account);
      
      // Step 1: Get authentication message
      const messageResponse = await axios.post(`${API_BASE_URL}/api/auth/message`, {
        address: cleanAddress
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!messageResponse.data.success) {
        throw new Error(messageResponse.data.message || 'Failed to get authentication message');
      }

      const message = messageResponse.data.message;

      // Step 2: Sign the message with MetaMask
      const signature = await web3.signer.signMessage(message);

      // Step 3: Verify signature and get JWT token
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/verify`, {
        address: cleanAddress,
        signature: signature,
        message: message
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!authResponse.data.success) {
        throw new Error(authResponse.data.message || 'Authentication failed');
      }

      const token = authResponse.data.token;
      
      // Store token and set authentication state
      localStorage.setItem('bharatchain_token', token);
      setAuthToken(token);
      setIsAuthenticated(true);
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setError('');
      alert('Wallet authenticated successfully!');
      
      return { success: true };
    } catch (error) {
      console.error('Authentication error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid signature. Please try again.';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Signature rejected by user.';
      } else if (error.message?.includes('ENS')) {
        errorMessage = 'Network connection issue. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // User data state
  const [userProfile, setUserProfile] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [userGrievances, setUserGrievances] = useState([]);
  
  // Dialogs
  const [registerDialog, setRegisterDialog] = useState(false);
  const [grievanceDialog, setGrievanceDialog] = useState(false);
  
  // Form states
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    aadharNumber: '',
    phone: '',
  });
  
  const [grievanceForm, setGrievanceForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: '',
  });

  // Configure axios defaults with proper headers
  useEffect(() => {
    axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
    axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
    axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!isAuthenticated || !authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/citizens/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        setIsAuthenticated(false);
        setAuthToken(null);
        localStorage.removeItem('bharatchain_token');
      } else if (err.response?.status === 404) {
        // Profile not found - user not registered
        setUserProfile(null);
      }
    }
  };

  // Fetch user documents
  const fetchUserDocuments = async () => {
    if (!isAuthenticated || !authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserDocuments(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAuthToken(null);
        localStorage.removeItem('bharatchain_token');
      }
    }
  };

  // Fetch user grievances
  const fetchUserGrievances = async () => {
    if (!isAuthenticated || !authToken) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/grievances`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserGrievances(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch grievances:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setAuthToken(null);
        localStorage.removeItem('bharatchain_token');
      }
    }
  };

  // Load data when authenticated
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && authToken) {
        try {
          await Promise.all([
            fetchUserProfile(),
            fetchUserDocuments(),
            fetchUserGrievances()
          ]);
        } catch (err) {
          console.error('Failed to load initial data:', err);
        }
      }
    };
    
    loadData();
  }, [isAuthenticated, authToken]);

  // Register citizen with proper error handling
  const handleRegister = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      // Check if wallet is connected and authenticated
      if (!isConnected || !account) {
        throw new Error('Please connect your wallet first');
      }

      if (!isAuthenticated) {
        throw new Error('Please authenticate your wallet first');
      }

      // Prepare registration data
      const registrationData = {
        fullName: formData.fullName,
        aadharNumber: formData.aadharNumber,
        phoneNumber: formData.phoneNumber,
        walletAddress: cleanWalletAddress(formData.walletAddress || account)
      };

      // Register citizen
      const response = await axios.post(`${API_BASE_URL}/api/citizens/register`, registrationData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 10000,
      });
      
      if (response.data.success) {
        setRegisterDialog(false);
        setError('');
        
        // Update user profile with new data
        setUserProfile(response.data.citizen);
        
        // Show success message
        alert('Registration successful! Welcome to BharatChain.');
        
        // Reload data
        await loadData();
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Submit grievance with proper error handling
  const handleSubmitGrievance = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/grievances`, grievanceForm, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (response.data.success) {
        toast.success('Grievance submitted successfully!');
        setGrievanceDialog(false);
        setGrievanceForm({
          title: '',
          description: '',
          category: '',
          priority: 'medium',
          location: '',
        });
        await fetchUserGrievances();
      } else {
        setError(response.data.message || 'Failed to submit grievance');
      }
    } catch (err) {
      console.error('Grievance submission error:', err);
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Unable to connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Network error during submission');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'resolved':
        return <CheckCircle color="success" />;
      case 'pending':
      case 'submitted':
      case 'under_review':
        return <Pending color="warning" />;
      case 'rejected':
        return <ErrorIcon color="error" />;
      default:
        return <Warning color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'resolved':
        return 'success';
      case 'pending':
      case 'submitted':
      case 'under_review':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const refreshData = () => {
    fetchUserProfile();
    fetchUserDocuments();
    fetchUserGrievances();
    toast.success('Data refreshed!');
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Header 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode}
        isAuthenticated={isAuthenticated}
        authenticateWallet={authenticateWallet}
        account={account}
        isConnected={isConnected}
        userProfile={userProfile}
      />
      
      {/* Main Content */}
      <Box sx={{ pt: 8 }}>
        {/* Alert Messages */}
        <AnimatePresence>
          {error && (
            <MotionBox
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              sx={{ mx: 2, mt: 2 }}
            >
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </MotionBox>
          )}
        </AnimatePresence>

        <MotionContainer 
          maxWidth="xl" 
          sx={{ mt: 4, mb: 4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Navigation Tabs */}
          <Paper 
            elevation={0}
            sx={{ 
              mb: 4, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }
              }}
            >
              <Tab icon={<DashboardOutlined />} label="Dashboard" />
              <Tab icon={<Person />} label="Profile" />
              <Tab icon={<Description />} label="Documents" />
              <Tab icon={<ReportProblem />} label="Grievances" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <MotionBox
              key={currentTab}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Dashboard Tab */}
              {currentTab === 0 && (
                <DashboardOverview
                  userDocuments={userDocuments}
                  userGrievances={userGrievances}
                  isRegistered={userProfile !== null}
                  isVerified={userProfile?.isVerified || false}
                  isConnected={isConnected}
                  isAuthenticated={isAuthenticated}
                  userProfile={userProfile}
                  onRegister={() => setRegisterDialog(true)}
                  onSubmitGrievance={() => setGrievanceDialog(true)}
                  onUploadDocument={() => toast.info('Document upload feature coming soon!')}
                  onAuthenticate={authenticateWallet}
                />
              )}

              {/* Profile Tab */}
              {currentTab === 1 && (
                <ProfileSection
                  userProfile={userProfile}
                  userAddress={userAddress}
                  isVerified={isVerified}
                  userDocuments={userDocuments}
                  userGrievances={userGrievances}
                  onRegister={() => setRegisterDialog(true)}
                />
              )}

              {/* Documents Tab */}
              {currentTab === 2 && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description color="primary" />
                        My Documents
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<FileUpload />}
                        onClick={() => toast.info('Document upload feature will be available soon!')}
                      >
                        Upload Document
                      </Button>
                    </Box>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Document Type</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Upload Date</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userDocuments.length > 0 ? (
                          userDocuments.map((doc, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{doc.documentType || 'Unknown Document'}</TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(doc.status)}
                                  label={doc.status || 'pending'}
                                  color={getStatusColor(doc.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined">
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                              <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No documents uploaded yet
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Upload your first document to get started
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Grievances Tab */}
              {currentTab === 3 && (
                <Paper 
                  elevation={0}
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReportProblem color="secondary" />
                        My Grievances
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setGrievanceDialog(true)}
                      >
                        Submit New Grievance
                      </Button>
                    </Box>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Title</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Submitted Date</strong></TableCell>
                          <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userGrievances.length > 0 ? (
                          userGrievances.map((grievance, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{grievance.title}</TableCell>
                              <TableCell>
                                <Chip
                                  label={grievance.category}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(grievance.status)}
                                  label={grievance.status || 'submitted'}
                                  color={getStatusColor(grievance.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {grievance.createdAt ? new Date(grievance.createdAt).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined">
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                              <ReportProblem sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No grievances submitted yet
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Submit your first grievance to get started
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </MotionBox>
          </AnimatePresence>

          {/* Floating Action Button for Refresh */}
          <Fab
            color="primary"
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24,
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
            onClick={refreshData}
          >
            <Refresh />
          </Fab>
        </MotionContainer>
      </Box>

      {/* Citizen Registration Modal */}
      <CitizenRegistrationModal
        open={registerDialog}
        onClose={() => setRegisterDialog(false)}
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        walletAddress={account}
      />

      {/* Grievance Dialog */}
      <Dialog 
        open={grievanceDialog} 
        onClose={() => setGrievanceDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportProblem color="secondary" />
            Submit New Grievance
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Grievance Title *"
            value={grievanceForm.title}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
            margin="normal"
            required
            placeholder="Brief description of the issue"
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Detailed Description *"
            multiline
            rows={4}
            value={grievanceForm.description}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
            margin="normal"
            required
            placeholder="Provide detailed information about your grievance"
            variant="outlined"
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category *</InputLabel>
                <Select
                  value={grievanceForm.category}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                  label="Category *"
                >
                  <MenuItem value="infrastructure">🏗️ Infrastructure</MenuItem>
                  <MenuItem value="healthcare">🏥 Healthcare</MenuItem>
                  <MenuItem value="education">🎓 Education</MenuItem>
                  <MenuItem value="water_supply">💧 Water Supply</MenuItem>
                  <MenuItem value="electricity">⚡ Electricity</MenuItem>
                  <MenuItem value="transportation">🚌 Transportation</MenuItem>
                  <MenuItem value="sanitation">🧹 Sanitation</MenuItem>
                  <MenuItem value="corruption">⚖️ Corruption</MenuItem>
                  <MenuItem value="other">📋 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={grievanceForm.priority}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">🟢 Low</MenuItem>
                  <MenuItem value="medium">🟡 Medium</MenuItem>
                  <MenuItem value="high">🟠 High</MenuItem>
                  <MenuItem value="urgent">🔴 Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Location *"
            value={grievanceForm.location}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, location: e.target.value })}
            margin="normal"
            required
            placeholder="Ward/Area/City where the issue exists"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setGrievanceDialog(false)} size="large">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitGrievance} 
            variant="contained"
            disabled={loading || !grievanceForm.title || !grievanceForm.description || !grievanceForm.category || !grievanceForm.location}
            size="large"
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit Grievance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CitizenDashboard;
