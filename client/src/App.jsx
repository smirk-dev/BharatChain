import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Badge,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Switch,
  Menu,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance,
  Security,
  CloudUpload,
  Person,
  Description,
  ReportProblem,
  Add,
  Refresh,
  CheckCircle,
  Pending,
  Warning,
  Error as ErrorIcon,
  FileUpload,
  VerifiedUser,
  Analytics,
  LocalHospital,
  SmartToy,
  AccountBalanceWallet,
  Language,
  Brightness4,
  Brightness7,
  SupervisorAccount,
} from '@mui/icons-material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

// Import our custom contexts and components
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import useWeb3 from './hooks/useWeb3';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import HealthcareModule from './components/Healthcare/HealthcareModule';
import AIDocumentProcessor from './components/AI/AIDocumentProcessor';
import GovernmentAdminPortal from './components/Admin/GovernmentAdminPortal';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

function AppContent() {
  // Hooks
  const { theme, toggleMode, isDark } = useTheme();
  const { t, changeLanguage, supportedLanguages, getCurrentLanguage } = useLanguage();
  const { 
    account, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    isLoading: web3Loading, 
    error: web3Error,
    getNetworkName,
    isNetworkSupported 
  } = useWeb3();

  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [userGrievances, setUserGrievances] = useState([]);
  
  // Dialogs
  const [registerDialog, setRegisterDialog] = useState(false);
  const [documentDialog, setDocumentDialog] = useState(false);
  const [grievanceDialog, setGrievanceDialog] = useState(false);
  
  // Menu states
  const [languageMenu, setLanguageMenu] = useState(null);
  const [walletMenu, setWalletMenu] = useState(null);
  
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

  // Demo login with Web3 integration
  const demoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try to connect Web3 wallet first
      if (!isConnected) {
        await connectWallet();
      }
      
      // In demo mode, we'll just simulate login
      setIsLoggedIn(true);
      await fetchUserProfile();
      await fetchUserDocuments();
      await fetchUserGrievances();
      setSuccess(t('Successfully logged in to demo account!'));
    } catch (err) {
      setError(t('Failed to login to demo account'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/citizens/profile`, {
        headers: {
          'Authorization': 'Bearer demo-token', // Demo mode
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  // Fetch user documents
  const fetchUserDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          'Authorization': 'Bearer demo-token', // Demo mode
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDocuments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  // Fetch user grievances
  const fetchUserGrievances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/grievances`, {
        headers: {
          'Authorization': 'Bearer demo-token', // Demo mode
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserGrievances(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch grievances:', err);
    }
  };

  // Register citizen
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/citizens/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token',
        },
        body: JSON.stringify(registerForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Citizen registered successfully!');
        setRegisterDialog(false);
        await fetchUserProfile();
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  // Submit grievance
  const handleSubmitGrievance = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/grievances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token',
        },
        body: JSON.stringify(grievanceForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Grievance submitted successfully!');
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
        setError(data.message || 'Failed to submit grievance');
      }
    } catch (err) {
      setError('Network error during submission');
    } finally {
      setLoading(false);
    }
  };

  // Status icon helper
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

  // Status color helper
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

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle Web3 errors
  useEffect(() => {
    if (web3Error) {
      setError(web3Error);
    }
  }, [web3Error]);

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenu(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageMenu(null);
  };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    handleLanguageMenuClose();
  };

  const handleWalletMenuOpen = (event) => {
    setWalletMenu(event.currentTarget);
  };

  const handleWalletMenuClose = () => {
    setWalletMenu(null);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
              <AccountBalance />
            </Avatar>
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('appTitle')}
            </Typography>
            
            {/* Language Selector */}
            <Tooltip title="Change Language">
              <IconButton color="inherit" onClick={handleLanguageMenuOpen}>
                <Language />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={languageMenu}
              open={Boolean(languageMenu)}
              onClose={handleLanguageMenuClose}
            >
              {supportedLanguages.map((lang) => (
                <MenuItem 
                  key={lang.code} 
                  onClick={() => handleLanguageChange(lang.code)}
                  selected={getCurrentLanguage().code === lang.code}
                >
                  {lang.nativeName}
                </MenuItem>
              ))}
            </Menu>
            
            {/* Theme Toggle */}
            <Tooltip title="Toggle Theme">
              <IconButton color="inherit" onClick={toggleMode}>
                {isDark ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            
            {/* Web3 Wallet */}
            {isConnected ? (
              <>
                <Tooltip title="Wallet Connected">
                  <IconButton color="inherit" onClick={handleWalletMenuOpen}>
                    <AccountBalanceWallet />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={walletMenu}
                  open={Boolean(walletMenu)}
                  onClose={handleWalletMenuClose}
                >
                  <MenuItem disabled>
                    <Typography variant="body2">
                      Address: {formatAddress(account)}
                    </Typography>
                  </MenuItem>
                  <MenuItem disabled>
                    <Typography variant="body2">
                      Network: {getNetworkName()}
                    </Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => {
                    disconnectWallet();
                    handleWalletMenuClose();
                  }}>
                    Disconnect Wallet
                  </MenuItem>
                </Menu>
                <Chip
                  icon={<VerifiedUser />}
                  label={formatAddress(account)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                onClick={connectWallet}
                disabled={web3Loading}
                startIcon={web3Loading ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
                sx={{ mr: 2 }}
              >
                Connect Wallet
              </Button>
            )}
            
            <Chip
              icon={<Security />}
              label={t('demoMode')}
              color="secondary"
              size="small"
              sx={{ mr: 2 }}
            />
            
            {!isLoggedIn ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={demoLogin}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <Person />}
              >
                {t('demoLogin')}
              </Button>
            ) : (
              <Chip
                icon={<VerifiedUser />}
                label={userProfile?.name || 'Demo User'}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Toolbar>
        </AppBar>

        {/* Alert Messages */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {!isLoggedIn ? (
            /* Landing Page */
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 64, height: 64 }}>
                <AccountBalance sx={{ fontSize: 32 }} />
              </Avatar>
              
              <Typography variant="h4" gutterBottom>
                {t('welcome')}
              </Typography>
              
              <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
                {t('welcomeSubtitle')}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                {t('welcomeDescription')}
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={demoLogin}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Person />}
              >
                {loading ? t('loading') : t('accessDemo')}
              </Button>
            </Paper>
          ) : (
            /* Dashboard */
            <>
              {/* Navigation Tabs */}
              <Paper elevation={1} sx={{ mb: 3 }}>
                <Tabs 
                  value={currentTab} 
                  onChange={(e, newValue) => setCurrentTab(newValue)}
                  textColor="primary"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab icon={<Person />} label={t('profile')} />
                  <Tab icon={<Description />} label={t('documents')} />
                  <Tab icon={<ReportProblem />} label={t('grievances')} />
                  <Tab icon={<Analytics />} label={t('analytics')} />
                  <Tab icon={<LocalHospital />} label={t('healthcare')} />
                  <Tab icon={<SmartToy />} label="AI Processing" />
                  <Tab icon={<SupervisorAccount />} label="Admin Portal" />
                </Tabs>
              </Paper>

              {/* Profile Tab */}
              {currentTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card elevation={2}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          {t('citizenProfile')}
                        </Typography>
                        
                        {userProfile ? (
                          <Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">{t('name')}</Typography>
                                <Typography variant="body1">{userProfile.name}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">{t('email')}</Typography>
                                <Typography variant="body1">{userProfile.email || 'Not provided'}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">{t('address')}</Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                  {userProfile.address}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">{t('status')}</Typography>
                                <Chip
                                  icon={getStatusIcon(userProfile.isVerified ? 'verified' : 'pending')}
                                  label={userProfile.isVerified ? t('verified') : t('pending')}
                                  color={userProfile.isVerified ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="textSecondary" gutterBottom>
                              No profile found. Please register as a citizen.
                            </Typography>
                            <Button
                              variant="contained"
                              onClick={() => setRegisterDialog(true)}
                              startIcon={<Person />}
                            >
                              Register Now
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Quick Stats
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Description />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={userDocuments.length}
                              secondary={t('documents')}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <ReportProblem />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={userGrievances.length}
                              secondary={t('grievances')}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Documents Tab */}
              {currentTab === 1 && (
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        My Documents
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<FileUpload />}
                        onClick={() => setDocumentDialog(true)}
                      >
                        Upload Document
                      </Button>
                    </Box>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Document Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Upload Date</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userDocuments.length > 0 ? (
                            userDocuments.map((doc, index) => (
                              <TableRow key={index}>
                                <TableCell>{doc.documentType || 'Unknown'}</TableCell>
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
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} align="center">
                                <Typography variant="body2" color="textSecondary">
                                  No documents uploaded yet
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Grievances Tab */}
              {currentTab === 2 && (
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        My Grievances
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setGrievanceDialog(true)}
                      >
                        Submit Grievance
                      </Button>
                    </Box>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Submitted Date</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {userGrievances.length > 0 ? (
                            userGrievances.map((grievance, index) => (
                              <TableRow key={index}>
                                <TableCell>{grievance.title}</TableCell>
                                <TableCell>{grievance.category}</TableCell>
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
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="textSecondary">
                                  No grievances submitted yet
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Tab */}
              {currentTab === 3 && <AnalyticsDashboard />}

              {/* Healthcare Tab */}
              {currentTab === 4 && <HealthcareModule />}

              {/* AI Processing Tab */}
              {currentTab === 5 && <AIDocumentProcessor />}

              {/* Government Admin Portal Tab */}
              {currentTab === 6 && <GovernmentAdminPortal />}

              {/* Floating Action Button for Refresh */}
              <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => {
                  fetchUserProfile();
                  fetchUserDocuments();
                  fetchUserGrievances();
                }}
              >
                <Refresh />
              </Fab>
            </>
          )}
        </Container>

        {/* Register Dialog */}
        <Dialog open={registerDialog} onClose={() => setRegisterDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Register as Citizen</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Full Name"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Aadhar Number"
              value={registerForm.aadharNumber}
              onChange={(e) => setRegisterForm({ ...registerForm, aadharNumber: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegisterDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRegister} 
              variant="contained"
              disabled={loading || !registerForm.name || !registerForm.aadharNumber}
            >
              {loading ? <CircularProgress size={20} /> : 'Register'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Grievance Dialog */}
        <Dialog open={grievanceDialog} onClose={() => setGrievanceDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Submit New Grievance</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={grievanceForm.title}
              onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={grievanceForm.description}
              onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
              margin="normal"
              required
            />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={grievanceForm.category}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="infrastructure">Infrastructure</MenuItem>
                    <MenuItem value="healthcare">Healthcare</MenuItem>
                    <MenuItem value="education">Education</MenuItem>
                    <MenuItem value="water_supply">Water Supply</MenuItem>
                    <MenuItem value="electricity">Electricity</MenuItem>
                    <MenuItem value="transportation">Transportation</MenuItem>
                    <MenuItem value="sanitation">Sanitation</MenuItem>
                    <MenuItem value="corruption">Corruption</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={grievanceForm.priority}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Location"
              value={grievanceForm.location}
              onChange={(e) => setGrievanceForm({ ...grievanceForm, location: e.target.value })}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGrievanceDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitGrievance} 
              variant="contained"
              disabled={loading || !grievanceForm.title || !grievanceForm.description || !grievanceForm.category || !grievanceForm.location}
            >
              {loading ? <CircularProgress size={20} /> : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MuiThemeProvider>
  );
}

// Main App component with providers
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
