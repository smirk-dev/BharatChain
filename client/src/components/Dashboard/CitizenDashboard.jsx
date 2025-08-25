import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  Avatar,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  ReportProblem as GrievanceIcon,
  Psychology as AIIcon,
  Verified,
  TrendingUp,
  Speed,
  Security,
  Refresh,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera,
  LocationOn,
  Email,
  Phone,
  Work,
  School,
  AccountBalance
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </motion.div>
      )}
    </div>
  );
}

const CitizenDashboard = () => {
  const { account, isConnected } = useWeb3();
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingGrievances: 0,
    resolvedGrievances: 0
  });

  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    panNumber: '',
    occupation: '',
    education: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: '',
    isVerified: false,
    profileImage: null
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Profile functions
  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const response = await fetch('http://localhost:3001/api/citizens/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.citizen) {
          const profileData = {
            name: data.citizen.name || '',
            email: data.citizen.email || '',
            phone: data.citizen.phone || '',
            address: data.citizen.address || '',
            city: data.citizen.city || '',
            state: data.citizen.state || '',
            pincode: data.citizen.pincode || '',
            aadharNumber: data.citizen.aadharNumber || '',
            panNumber: data.citizen.panNumber || '',
            occupation: data.citizen.occupation || '',
            education: data.citizen.education || '',
            dateOfBirth: data.citizen.dateOfBirth || '',
            gender: data.citizen.gender || '',
            emergencyContact: data.citizen.emergencyContact || '',
            isVerified: data.citizen.isVerified || false,
            profileImage: data.citizen.profileImage || null
          };
          setProfile(profileData);
          setOriginalProfile(profileData);
        } else {
          // Profile doesn't exist, show empty form for new registration
          setProfile({
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            aadharNumber: '',
            panNumber: '',
            occupation: '',
            education: '',
            dateOfBirth: '',
            gender: '',
            emergencyContact: '',
            isVerified: false,
            profileImage: null
          });
        }
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileError('Failed to load profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleProfileSave = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileSuccess(null);

      // Validate required fields
      if (!profile.name || !profile.email || !profile.phone) {
        setProfileError('Please fill in all required fields (Name, Email, Phone)');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        setProfileError('Please enter a valid email address');
        return;
      }

      // Phone validation
      const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/;
      if (!phoneRegex.test(profile.phone)) {
        setProfileError('Please enter a valid phone number');
        return;
      }

      const response = await fetch('http://localhost:3001/api/citizens/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          walletAddress: account,
          ...profile
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsEditingProfile(false);
        setOriginalProfile(profile);
        setProfileSuccess('Profile saved successfully!');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfile(originalProfile);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock data loading
  useEffect(() => {
    if (isConnected && account) {
      setIsLoading(true);
      
      // Load stats and profile data
      Promise.all([
        // Load stats (keeping as mock for now)
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              totalDocuments: 5,
              verifiedDocuments: 3,
              pendingGrievances: 2,
              resolvedGrievances: 8
            });
          }, 500);
        }),
        // Load real profile data
        loadProfile()
      ]).then(([statsData]) => {
        setStats(statsData);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      });
    }
  }, [isConnected, account]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Profile', icon: <PersonIcon /> },
    { label: 'Documents', icon: <DocumentIcon /> },
    { label: 'Grievances', icon: <GrievanceIcon /> },
    { label: 'AI Analysis', icon: <AIIcon /> }
  ];

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Add new documents for verification',
      icon: <DocumentIcon />,
      action: () => setCurrentTab(2),
      color: 'primary'
    },
    {
      title: 'Submit Grievance',
      description: 'Report issues or complaints',
      icon: <GrievanceIcon />,
      action: () => setCurrentTab(3),
      color: 'secondary'
    },
    {
      title: 'AI Document Analysis',
      description: 'Advanced document processing',
      icon: <AIIcon />,
      action: () => setCurrentTab(4),
      color: 'info'
    },
    {
      title: 'Update Profile',
      description: 'Manage your information',
      icon: <PersonIcon />,
      action: () => setCurrentTab(1),
      color: 'success'
    }
  ];

  return (
    <Container maxWidth="xl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome to BharatChain Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Connected as: {formatAddress(account)} 
            <Chip 
              label="Verified" 
              size="small" 
              icon={<Verified />}
              color="success" 
              sx={{ ml: 2 }} 
            />
          </Typography>
        </Box>
      </motion.div>

      {/* Loading Progress */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Statistics Cards */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                📊 Overview Statistics
              </Typography>
            </Grid>

            {[
              {
                title: 'Total Documents',
                value: stats.totalDocuments,
                icon: <DocumentIcon sx={{ fontSize: 40 }} />,
                color: 'primary',
                trend: '+12%'
              },
              {
                title: 'Verified Documents',
                value: stats.verifiedDocuments,
                icon: <Verified sx={{ fontSize: 40 }} />,
                color: 'success',
                trend: '+8%'
              },
              {
                title: 'Pending Grievances',
                value: stats.pendingGrievances,
                icon: <GrievanceIcon sx={{ fontSize: 40 }} />,
                color: 'warning',
                trend: '-5%'
              },
              {
                title: 'Resolved Issues',
                value: stats.resolvedGrievances,
                icon: <TrendingUp sx={{ fontSize: 40 }} />,
                color: 'info',
                trend: '+25%'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      background: `linear-gradient(135deg, ${stat.color}.light 0%, ${stat.color}.main 50%, ${stat.color}.light 100%)`,
                      color: 'black',
                      '& .MuiTypography-root': {
                        color: 'black',
                        textShadow: 'none'
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'black'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {stat.icon}
                        <Chip 
                          label={stat.trend} 
                          size="small" 
                          sx={{ 
                            ml: 'auto',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            color: 'black',
                            fontWeight: 600
                          }} 
                        />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, mt: 2 }}>
                🚀 Quick Actions
              </Typography>
            </Grid>

            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    sx={{ 
                      p: 2, 
                      height: '100%', 
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      '&:hover': {
                        borderColor: `${action.color}.main`,
                        boxShadow: 6
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        color={action.color}
                        size="small"
                        sx={{ mt: 2 }}
                        startIcon={<AddIcon />}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* System Status */}
            <Grid item xs={12}>
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, color: 'black' }}>
                      🔧 System Status
                    </Typography>
                    <Tooltip title="Refresh Status">
                      <IconButton size="small" sx={{ color: 'black' }}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {[
                      { name: 'Blockchain Network', status: 'Connected', icon: <Security /> },
                      { name: 'IPFS Storage', status: 'Online', icon: <Speed /> },
                      { name: 'AI Processing', status: 'Available', icon: <AIIcon /> },
                      { name: 'Document Verification', status: 'Active', icon: <Verified /> }
                    ].map((service, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 2, 
                          background: 'linear-gradient(135deg, success.light 0%, success.main 100%)',
                          borderRadius: 2,
                          color: 'black',
                          '& .MuiTypography-root': {
                            color: 'black'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'black'
                          }
                        }}>
                          {service.icon}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {service.name}
                            </Typography>
                            <Typography variant="caption">
                              {service.status}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
                      👤 Citizen Profile
                    </Typography>
                    {!isEditingProfile ? (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleProfileEdit}
                        sx={{ ml: 2 }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleProfileCancel}
                          disabled={profileLoading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {profileLoading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                    </Box>
                  )}

                  {profileError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError(null)}>
                      {profileError}
                    </Alert>
                  )}

                  {profileSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess(null)}>
                      {profileSuccess}
                    </Alert>
                  )}

                  {/* Profile Picture Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Avatar
                      src={profile.profileImage}
                      sx={{ width: 100, height: 100, mr: 3 }}
                    >
                      {profile.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {profile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Wallet: {formatAddress(account)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={profile.isVerified ? "Verified Citizen" : "Pending Verification"}
                          color={profile.isVerified ? "success" : "warning"}
                          size="small"
                          icon={<Verified />}
                        />
                        {isEditingProfile && (
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<PhotoCamera />}
                          >
                            Upload Photo
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={handleImageUpload}
                            />
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name *"
                        value={profile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        required
                        error={isEditingProfile && !profile.name}
                        helperText={isEditingProfile && !profile.name ? "Name is required" : ""}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!isEditingProfile}>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={profile.gender}
                          label="Gender"
                          onChange={(e) => handleProfileChange('gender', e.target.value)}
                          variant={isEditingProfile ? "outlined" : "filled"}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                          <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={profile.education}
                        onChange={(e) => handleProfileChange('education', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <School sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Occupation"
                        value={profile.occupation}
                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Emergency Contact"
                        value={profile.emergencyContact}
                        onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1 }} />
                    Address Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        value={profile.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="City"
                        value={profile.city}
                        onChange={(e) => handleProfileChange('city', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="State"
                        value={profile.state}
                        onChange={(e) => handleProfileChange('state', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="PIN Code"
                        value={profile.pincode}
                        onChange={(e) => handleProfileChange('pincode', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Government IDs */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1 }} />
                    Government Identification
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Aadhar Number"
                        value={profile.aadharNumber}
                        onChange={(e) => handleProfileChange('aadharNumber', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        helperText="12-digit Aadhar number"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="PAN Number"
                        value={profile.panNumber}
                        onChange={(e) => handleProfileChange('panNumber', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        helperText="10-character PAN number"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Verification Status:</strong> Your identity documents are verified and secured on the blockchain.
                  </Alert>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date().toLocaleDateString()}
                    </Typography>
                    <Chip
                      label="Blockchain Verified"
                      color="success"
                      icon={<Verified />}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={currentTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                📄 Document Management
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Document upload and management functionality will be implemented here.
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Grievances Tab */}
        <TabPanel value={currentTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                📝 Grievance System
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Grievance submission and tracking functionality will be implemented here.
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>

        {/* AI Analysis Tab */}
        <TabPanel value={currentTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                🤖 AI Document Analysis
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Advanced AI-powered document analysis tools will be implemented here.
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>
      </AnimatePresence>
    </Container>
  );
};

export default CitizenDashboard;
