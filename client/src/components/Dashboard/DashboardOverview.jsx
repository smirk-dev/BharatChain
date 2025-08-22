import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  CheckCircle,
  Description,
  ReportProblem,
  AccountBalanceWallet,
  VerifiedUser,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const DashboardOverview = ({ 
  userDocuments = [], 
  userGrievances = [], 
  isRegistered, 
  isVerified, 
  isConnected,
  isAuthenticated,
  userProfile,
  onRegister,
  onSubmitGrievance,
  onUploadDocument,
  onAuthenticate 
}) => {
  const theme = useTheme();

  const stats = [
    {
      title: 'Documents',
      value: userDocuments.length,
      icon: Description,
      color: 'primary',
      description: 'Total uploaded',
      change: '+2 this month'
    },
    {
      title: 'Grievances',
      value: userGrievances.length,
      icon: ReportProblem,
      color: 'secondary',
      description: 'Total submitted',
      change: userGrievances.filter(g => g.status === 'resolved').length + ' resolved'
    },
    {
      title: 'Verification',
      value: isVerified ? '100%' : '0%',
      icon: VerifiedUser,
      color: isVerified ? 'success' : 'warning',
      description: 'Account status',
      change: isVerified ? 'Verified' : 'Pending'
    },
    {
      title: 'Blockchain',
      value: isConnected ? 'Active' : 'Inactive',
      icon: AccountBalanceWallet,
      color: isConnected ? 'success' : 'error',
      description: 'Connection status',
      change: 'Secure'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Welcome Hero Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: 4 }}
      >
        <Card 
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
              borderRadius: '50%',
              transform: 'translate(50%, -50%)',
            }}
          />
          <CardContent sx={{ p: 4, position: 'relative' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  🇮🇳 Welcome to BharatChain
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Your Digital Governance Platform powered by Blockchain
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, maxWidth: 600 }}>
                  Access citizen services, manage documents, and submit grievances securely 
                  using cutting-edge blockchain technology. Experience transparent, efficient, 
                  and trustworthy governance.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  <Chip
                    icon={<VerifiedUser />}
                    label={isRegistered ? '✅ Registered' : '⚠️ Not Registered'}
                    color={isRegistered ? 'success' : 'warning'}
                    variant={isRegistered ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={<CheckCircle />}
                    label={isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                    color={isVerified ? 'success' : 'warning'}
                    variant={isVerified ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={<AccountBalanceWallet />}
                    label={isConnected ? '🔗 Wallet Connected' : '❌ No Wallet'}
                    color={isConnected ? 'success' : 'error'}
                    variant={isConnected ? 'filled' : 'outlined'}
                  />
                  <Chip
                    icon={<Security />}
                    label={isAuthenticated ? '🔐 Authenticated' : '🔓 Not Authenticated'}
                    color={isAuthenticated ? 'success' : 'warning'}
                    variant={isAuthenticated ? 'filled' : 'outlined'}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {!isConnected && (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Connect your wallet to get started
                      </Typography>
                    </Box>
                  )}
                  
                  {isConnected && !isAuthenticated && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onAuthenticate}
                      sx={{ borderRadius: 2 }}
                      color="primary"
                    >
                      Authenticate Wallet
                    </Button>
                  )}
                  
                  {isAuthenticated && !isRegistered && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={onRegister}
                      sx={{ borderRadius: 2 }}
                      color="success"
                    >
                      Register as Citizen
                    </Button>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={onSubmitGrievance}
                        sx={{ borderRadius: 2 }}
                        disabled={!isRegistered}
                      >
                        Submit Grievance
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={onUploadDocument}
                        sx={{ borderRadius: 2 }}
                        disabled={!isRegistered}
                      >
                        Upload Document
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    component="img"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M100 20L180 60v80L100 180L20 140V60z' fill='%23FF6D00' opacity='0.2'/%3E%3Cpath d='M100 40L160 70v60L100 160L40 130V70z' fill='%23138808' opacity='0.3'/%3E%3Ccircle cx='100' cy='100' r='30' fill='%23FF6D00'/%3E%3C/svg%3E"
                    alt="BharatChain Logo"
                    sx={{ width: 150, height: 150, opacity: 0.7 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </MotionBox>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MotionCard
                variants={itemVariants}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 32px ${theme.palette[stat.color].main}20`,
                    borderColor: theme.palette[stat.color].main,
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette[stat.color].main}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <stat.icon 
                      sx={{ 
                        fontSize: 30, 
                        color: `${theme.palette[stat.color].main}` 
                      }} 
                    />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {stat.description}
                  </Typography>
                  <Chip 
                    label={stat.change} 
                    size="small" 
                    color={stat.color}
                    variant="outlined"
                  />
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Progress Section */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          mb: 4
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp color="primary" />
            Account Progress
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Registration Status
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={isRegistered ? 100 : 0} 
                  color="primary"
                  sx={{ height: 8, borderRadius: 4, mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Verification Status
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={isVerified ? 100 : 50} 
                  color="secondary"
                  sx={{ height: 8, borderRadius: 4, mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Blockchain Connection
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={isConnected ? 100 : 0} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4, mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </MotionCard>

      {/* Feature Highlights */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                🔒 Secure & Transparent
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All transactions and data are secured using blockchain technology, 
                ensuring transparency and immutability.
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Speed sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                ⚡ Fast & Efficient
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quick document processing, instant grievance submission, 
                and real-time status updates.
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                ✅ Verified & Trusted
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Government-backed verification system ensures authenticity 
                and builds trust in digital governance.
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardOverview;
