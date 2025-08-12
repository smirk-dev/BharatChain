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
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// BharatChain theme
const bharatChainTheme = createTheme({
  palette: {
    primary: {
      main: '#FF6B35', // Saffron
      light: '#FFA366',
      dark: '#CC4B1A',
    },
    secondary: {
      main: '#138808', // Green
      light: '#4CAF50',
      dark: '#0D5D05',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
      color: '#2C3E50',
    },
    h6: {
      fontWeight: '600',
    },
  },
});

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
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

  // Demo login (since we're in demo mode)
  const demoLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // In demo mode, we'll just simulate login
      setIsLoggedIn(true);
      await fetchUserProfile();
      await fetchUserDocuments();
      await fetchUserGrievances();
      setSuccess('Successfully logged in to demo account!');
    } catch (err) {
      setError('Failed to login to demo account');
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

  return (
    <ThemeProvider theme={bharatChainTheme}>
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
            
            <Chip
              icon={<Security />}
              label="Demo Mode"
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
                Demo Login
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
                Welcome to BharatChain
              </Typography>
              
              <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
                India's Digital Governance Platform on Blockchain
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Secure citizen registration, document management, and grievance redressal system
                powered by blockchain technology. Experience transparent, efficient, and trustworthy
                digital governance.
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={demoLogin}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Person />}
              >
                {loading ? 'Connecting...' : 'Access Demo Dashboard'}
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
                  centered
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab icon={<Person />} label="Profile" />
                  <Tab icon={<Description />} label="Documents" />
                  <Tab icon={<ReportProblem />} label="Grievances" />
                </Tabs>
              </Paper>

              {/* Profile Tab */}
              {currentTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Card elevation={2}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Citizen Profile
                        </Typography>
                        
                        {userProfile ? (
                          <Box>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Name</Typography>
                                <Typography variant="body1">{userProfile.name}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Email</Typography>
                                <Typography variant="body1">{userProfile.email || 'Not provided'}</Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Address</Typography>
                                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                  {userProfile.address}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="textSecondary">Status</Typography>
                                <Chip
                                  icon={getStatusIcon(userProfile.isVerified ? 'verified' : 'pending')}
                                  label={userProfile.isVerified ? 'Verified' : 'Pending Verification'}
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
                              secondary="Documents"
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
                              secondary="Grievances"
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
    </ThemeProvider>
  );
}

export default App;
