import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  Description,
  Report,
  VerifiedUser,
  Warning,
  Notifications,
  TrendingUp,
} from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CitizenDashboard = () => {
  const { contracts, account, isConnected } = useWeb3();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    citizen: null,
    documents: [],
    grievances: [],
    notifications: [],
    stats: {
      totalDocuments: 0,
      verifiedDocuments: 0,
      pendingDocuments: 0,
      totalGrievances: 0,
      openGrievances: 0,
      resolvedGrievances: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && contracts.citizenRegistry && account) {
      loadDashboardData();
    }
  }, [isConnected, contracts, account]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load citizen data
      const citizenData = await contracts.citizenRegistry.getCitizen(account);
      
      // Load documents
      const documentIds = await contracts.documentRegistry.getCitizenDocuments(account);
      const documents = await Promise.all(
        documentIds.map(async (id) => {
          const doc = await contracts.documentRegistry.getDocument(id);
          return { id, ...doc };
        })
      );

      // Load grievances
      const grievanceIds = await contracts.grievanceSystem.getCitizenGrievances(account);
      const grievances = await Promise.all(
        grievanceIds.map(async (id) => {
          const grievance = await contracts.grievanceSystem.grievances(id);
          return { id, ...grievance };
        })
      );

      // Calculate stats
      const stats = {
        totalDocuments: documents.length,
        verifiedDocuments: documents.filter(d => d.status === 1).length, // DocumentStatus.Verified
        pendingDocuments: documents.filter(d => d.status === 0).length, // DocumentStatus.Pending
        totalGrievances: grievances.length,
        openGrievances: grievances.filter(g => g.status === 0).length, // GrievanceStatus.Open
        resolvedGrievances: grievances.filter(g => g.status === 2).length, // GrievanceStatus.Resolved
      };

      setDashboardData({
        citizen: {
          name: citizenData.name,
          email: citizenData.email,
          isVerified: citizenData.isVerified,
          registrationDate: new Date(Number(citizenData.registrationDate) * 1000),
          verificationDate: citizenData.verificationDate > 0 
            ? new Date(Number(citizenData.verificationDate) * 1000) 
            : null,
        },
        documents,
        grievances,
        notifications: generateNotifications(documents, grievances),
        stats,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (documents, grievances) => {
    const notifications = [];

    // Document notifications
    const pendingDocs = documents.filter(d => d.status === 0);
    if (pendingDocs.length > 0) {
      notifications.push({
        type: 'warning',
        title: 'Pending Document Verification',
        message: `You have ${pendingDocs.length} document(s) pending verification`,
        icon: <Warning color="warning" />,
      });
    }

    // Grievance notifications
    const openGrievances = grievances.filter(g => g.status === 0);
    if (openGrievances.length > 0) {
      notifications.push({
        type: 'info',
        title: 'Open Grievances',
        message: `You have ${openGrievances.length} open grievance(s)`,
        icon: <Report color="info" />,
      });
    }

    return notifications;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {dashboardData.citizen?.name || 'Citizen'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your documents, track grievances, and stay connected with government services.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                  <AccountCircle fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {dashboardData.citizen?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatAddress(account)}
                  </Typography>
                  <Chip
                    label={dashboardData.citizen?.isVerified ? 'Verified' : 'Unverified'}
                    color={dashboardData.citizen?.isVerified ? 'success' : 'warning'}
                    size="small"
                    icon={<VerifiedUser />}
                  />
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Registration Date: {dashboardData.citizen?.registrationDate?.toLocaleDateString()}
              </Typography>
              {dashboardData.citizen?.verificationDate && (
                <Typography variant="body2" color="text.secondary">
                  Verification Date: {dashboardData.citizen.verificationDate.toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Description color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{dashboardData.stats.totalDocuments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <VerifiedUser color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{dashboardData.stats.verifiedDocuments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Report color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{dashboardData.stats.totalGrievances}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Grievances
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{dashboardData.stats.resolvedGrievances}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Notifications */}
        {dashboardData.notifications.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notifications
                </Typography>
                <List>
                  {dashboardData.notifications.map((notification, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {notification.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.message}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Description />}
                  fullWidth
                  href="/documents"
                >
                  Upload Documents
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Report />}
                  fullWidth
                  href="/grievances"
                >
                  Submit Grievance
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AccountCircle />}
                  fullWidth
                  href="/profile"
                >
                  Update Profile
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
              {dashboardData.documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No documents uploaded yet.
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  {/* Add document table here */}
                  <Typography variant="body2">
                    {dashboardData.documents.length} document(s) found.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CitizenDashboard;
