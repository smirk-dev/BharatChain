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
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Menu,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  AccountBalance,
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
  AccountBalanceWallet,
  ExitToApp,
  ContentCopy,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';

// Import contexts
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';

// Import API functions
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const CitizenDashboard = () => {
  const { user, logout, isRegistered, isVerified, userAddress } = useAuth();
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();

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
  
  // Menu states
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

  // Configure axios defaults with proper headers
  useEffect(() => {
    axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
    axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
    axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/citizens/profile`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserProfile(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (err.code === 'NETWORK_ERROR') {
        setError('Unable to connect to server. Please ensure the backend is running on port 5000.');
      }
    }
  };

  // Fetch user documents
  const fetchUserDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/documents`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserDocuments(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  // Fetch user grievances
  const fetchUserGrievances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/grievances`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      if (response.data.success) {
        setUserGrievances(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch grievances:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchUserProfile(),
          fetchUserDocuments(),
          fetchUserGrievances()
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    
    loadData();
  }, []);

  // Register citizen with proper error handling
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/citizens/register`, registerForm, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      if (response.data.success) {
        toast.success('Citizen registered successfully!');
        setRegisterDialog(false);
        await fetchUserProfile();
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Unable to connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError(err.response?.data?.message || 'Network error during registration');
      }
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

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleWalletMenuOpen = (event) => {
    setWalletMenu(event.currentTarget);
  };

  const handleWalletMenuClose = () => {
    setWalletMenu(null);
  };

  const handleLogout = async () => {
    await logout();
    if (isConnected) {
      disconnectWallet();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
            <AccountBalance />
          </Avatar>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BharatChain - Digital Governance Platform
          </Typography>
          
          {/* Web3 Wallet */}
          {isConnected ? (
            <>
              <Tooltip title="Wallet Connected">
                <IconButton color="inherit" onClick={handleWalletMenuOpen}>
                  <Badge color="success" variant="dot">
                    <AccountBalanceWallet />
                  </Badge>
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
                <MenuItem onClick={() => copyToClipboard(account)}>
                  <ContentCopy sx={{ mr: 1 }} fontSize="small" />
                  Copy Address
                </MenuItem>
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
              startIcon={<AccountBalanceWallet />}
              sx={{ mr: 2 }}
            >
              Connect Wallet
            </Button>
          )}
          
          {/* User Info */}
          <Chip
            icon={<VerifiedUser />}
            label={user?.name || formatAddress(userAddress)}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mr: 2 }}
          />
          
          {/* Logout */}
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToApp />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Alert Messages */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Navigation Tabs */}
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Description />} label="Documents" />
          <Tab icon={<ReportProblem />} label="Grievances" />
        </Tabs>

        {/* Dashboard Tab */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {/* Welcome Card */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h4" gutterBottom color="primary">
                    🇮🇳 Welcome to BharatChain!
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Your Digital Governance Platform
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Access citizen services, manage documents, and submit grievances securely using blockchain technology.
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item>
                      <Chip
                        icon={<VerifiedUser />}
                        label={isRegistered ? '✅ Registered' : '❌ Not Registered'}
                        color={isRegistered ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid item>
                      <Chip
                        icon={<CheckCircle />}
                        label={isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                        color={isVerified ? 'success' : 'warning'}
                      />
                    </Grid>
                    <Grid item>
                      <Chip
                        icon={<AccountBalanceWallet />}
                        label={isConnected ? '🔗 Wallet Connected' : '❌ No Wallet'}
                        color={isConnected ? 'success' : 'error'}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Description sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h3" color="primary">
                    {userDocuments.length}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Documents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total uploaded documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ReportProblem sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h3" color="secondary">
                    {userGrievances.length}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Grievances
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total submitted grievances
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h3" color="success.main">
                    ✓
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System operational
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🚀 Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    {!isRegistered && (
                      <Grid item>
                        <Button
                          variant="contained"
                          startIcon={<Person />}
                          onClick={() => setRegisterDialog(true)}
                          size="large"
                        >
                          Register as Citizen
                        </Button>
                      </Grid>
                    )}
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<FileUpload />}
                        onClick={() => setCurrentTab(2)}
                      >
                        Upload Document
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={() => setGrievanceDialog(true)}
                      >
                        Submit Grievance
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => {
                          fetchUserProfile();
                          fetchUserDocuments();
                          fetchUserGrievances();
                          toast.success('Data refreshed!');
                        }}
                      >
                        Refresh Data
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Profile Tab */}
        {currentTab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card elevation={2}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    👤 Citizen Profile
                  </Typography>
                  
                  {userProfile ? (
                    <Box>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                          <Typography variant="h6">{userProfile.name}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
                          <Typography variant="h6">{userProfile.email || 'Not provided'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Wallet Address</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                              {userAddress}
                            </Typography>
                            <IconButton size="small" onClick={() => copyToClipboard(userAddress)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">Verification Status</Typography>
                          <Chip
                            icon={getStatusIcon(isVerified ? 'verified' : 'pending')}
                            label={isVerified ? 'Verified Citizen' : 'Pending Verification'}
                            color={isVerified ? 'success' : 'warning'}
                            sx={{ mt: 1 }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Person sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No profile found
                      </Typography>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        Please register as a citizen to access all features.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => setRegisterDialog(true)}
                        startIcon={<Person />}
                        size="large"
                        sx={{ mt: 2 }}
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
                    📊 Account Summary
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Description />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={userDocuments.length}
                        secondary="Documents Uploaded"
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
                        secondary="Grievances Submitted"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isVerified ? 'success.main' : 'warning.main' }}>
                          <VerifiedUser />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={isVerified ? 'Verified' : 'Unverified'}
                        secondary="Verification Status"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Documents Tab */}
        {currentTab === 2 && (
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  📄 My Documents
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FileUpload />}
                  onClick={() => toast.info('Document upload feature will be available soon!')}
                >
                  Upload Document
                </Button>
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
                        <TableRow key={index}>
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
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
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
            </CardContent>
          </Card>
        )}

        {/* Grievances Tab */}
        {currentTab === 3 && (
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  🗣️ My Grievances
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setGrievanceDialog(true)}
                >
                  Submit New Grievance
                </Button>
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
                        <TableRow key={index}>
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
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <ReportProblem sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
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
            </CardContent>
          </Card>
        )}

        {/* Floating Action Button for Refresh */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            fetchUserProfile();
            fetchUserDocuments();
            fetchUserGrievances();
            toast.success('Data refreshed!');
          }}
        >
          <Refresh />
        </Fab>
      </Container>

      {/* Register Dialog */}
      <Dialog open={registerDialog} onClose={() => setRegisterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>👤 Register as Citizen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Full Name *"
            value={registerForm.name}
            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Aadhar Number *"
            value={registerForm.aadharNumber}
            onChange={(e) => setRegisterForm({ ...registerForm, aadharNumber: e.target.value })}
            margin="normal"
            required
            placeholder="1234 5678 9012"
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={registerForm.phone}
            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
            margin="normal"
            placeholder="+91 98765 43210"
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
        <DialogTitle>🗣️ Submit New Grievance</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Grievance Title *"
            value={grievanceForm.title}
            onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
            margin="normal"
            required
            placeholder="Brief description of the issue"
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
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
              <FormControl fullWidth>
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrievanceDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitGrievance} 
            variant="contained"
            disabled={loading || !grievanceForm.title || !grievanceForm.description || !grievanceForm.category || !grievanceForm.location}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit Grievance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CitizenDashboard;
