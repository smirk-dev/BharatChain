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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Mock data loading
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setStats({
          totalDocuments: 5,
          verifiedDocuments: 3,
          pendingGrievances: 2,
          resolvedGrievances: 8
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [isConnected]);

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
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                👤 Citizen Profile
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Profile management functionality will be implemented here.
              </Alert>
              <Typography variant="body1">
                Connected wallet: {account}
              </Typography>
            </CardContent>
          </Card>
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
