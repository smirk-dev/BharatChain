import React from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Person,
  ContentCopy,
  Edit,
  VerifiedUser,
  Email,
  Phone,
  Home,
  CalendarToday,
  Description,
  ReportProblem,
  Timeline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MotionCard = motion(Card);

const ProfileSection = ({ 
  userProfile, 
  userAddress, 
  isVerified, 
  userDocuments = [], 
  userGrievances = [],
  onRegister 
}) => {
  const theme = useTheme();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Main Profile Card */}
          <Grid item xs={12} md={8}>
            <MotionCard
              variants={itemVariants}
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              {/* Profile Header */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
                  p: 3,
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 16px',
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: `0 8px 32px ${theme.palette.primary.main}20`,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                >
                  <Person sx={{ fontSize: 48 }} />
                </Avatar>
                
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {userProfile?.name || 'Citizen'}
                </Typography>
                
                <Chip
                  icon={<VerifiedUser />}
                  label={isVerified ? 'Verified Citizen' : 'Pending Verification'}
                  color={isVerified ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    size="small"
                    onClick={() => toast.info('Profile editing coming soon!')}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {userProfile ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Full Name
                          </Typography>
                          <Typography variant="h6">{userProfile.name}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Email />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Email Address
                          </Typography>
                          <Typography variant="h6">
                            {userProfile.email || 'Not provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <VerifiedUser />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Wallet Address
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                fontSize: '0.9rem',
                                wordBreak: 'break-all'
                              }}
                            >
                              {userAddress}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(userAddress)}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>

                    {userProfile.phone && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <Phone />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Phone Number
                            </Typography>
                            <Typography variant="h6">{userProfile.phone}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {userProfile.created_at && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'warning.main' }}>
                            <CalendarToday />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Member Since
                            </Typography>
                            <Typography variant="h6">
                              {new Date(userProfile.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Person sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Profile Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Please register as a citizen to access all BharatChain features.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={onRegister}
                      startIcon={<Person />}
                      size="large"
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      Register Now
                    </Button>
                  </Box>
                )}
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Stats & Activity Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Account Summary */}
              <MotionCard
                variants={itemVariants}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timeline color="primary" />
                    Account Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          <Description />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={userDocuments.length}
                        secondary="Documents Uploaded"
                        primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                          <ReportProblem />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={userGrievances.length}
                        secondary="Grievances Submitted"
                        primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: isVerified ? 'success.main' : 'warning.main',
                          width: 40, 
                          height: 40 
                        }}>
                          <VerifiedUser />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={isVerified ? 'Verified' : 'Unverified'}
                        secondary="Verification Status"
                        primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </MotionCard>

              {/* Recent Activity */}
              <MotionCard
                variants={itemVariants}
                elevation={0}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🕐 Recent Activity
                  </Typography>
                  <List dense>
                    {userDocuments.slice(0, 3).map((doc, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <Description fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Document: ${doc.documentType || 'Unknown'}`}
                          secondary={doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                    {userGrievances.slice(0, 2).map((grievance, index) => (
                      <ListItem key={`grievance-${index}`}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                            <ReportProblem fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Grievance: ${grievance.title}`}
                          secondary={grievance.createdAt ? new Date(grievance.createdAt).toLocaleDateString() : 'N/A'}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                    {userDocuments.length === 0 && userGrievances.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No recent activity"
                          secondary="Start by uploading documents or submitting grievances"
                          primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </MotionCard>
            </Box>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default ProfileSection;
