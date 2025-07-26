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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  AccountBalance,
  Security,
  CloudUpload,
  Visibility,
  Menu as MenuIcon,
  Wallet,
  VerifiedUser,
  Storage,
  Speed,
  Group,
  Timeline,
  Close,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// BharatChain theme with Indian flag colors
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

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  // Mock blockchain stats
  const [blockchainStats] = useState({
    totalTransactions: '1,24,567',
    activeNodes: '2,847',
    dataStored: '45.6 TB',
    uptime: '99.9%',
  });

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const connectWallet = async () => {
    // Mock wallet connection - replace with actual Web3 integration
    setWalletConnected(true);
    setUserAddress('0x1234...5678');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Timeline />, active: true },
    { text: 'Upload Data', icon: <CloudUpload /> },
    { text: 'Verify Documents', icon: <VerifiedUser /> },
    { text: 'Storage Manager', icon: <Storage /> },
    { text: 'Transaction History', icon: <AccountBalance /> },
    { text: 'Network Stats', icon: <Speed /> },
    { text: 'Community', icon: <Group /> },
  ];

  return (
    <ThemeProvider theme={bharatChainTheme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={2}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
              <AccountBalance />
            </Avatar>
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              BharatChain - Decentralized India Initiative
            </Typography>
            
            <Chip
              icon={<Security />}
              label="Mainnet"
              color="secondary"
              size="small"
              sx={{ mr: 2 }}
            />
            
            {walletConnected ? (
              <Chip
                icon={<Wallet />}
                label={userAddress}
                color="primary"
                variant="outlined"
                size="small"
              />
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Wallet />}
                onClick={connectWallet}
              >
                Connect Wallet
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Side Drawer */}
        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
          <Box sx={{ width: 280, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" color="primary">
                BharatChain Menu
              </Typography>
              <IconButton onClick={toggleDrawer}>
                <Close />
              </IconButton>
            </Box>
            
            <List>
              {menuItems.map((item, index) => (
                <ListItem 
                  button 
                  key={index}
                  sx={{ 
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: item.active ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'primary.light', opacity: 0.8 }
                  }}
                >
                  <ListItemIcon sx={{ color: item.active ? 'white' : 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ color: item.active ? 'white' : 'text.primary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Hero Section */}
          <Paper 
            elevation={3}
            sx={{
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #FF6B35 0%, #138808 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom>
                  Welcome to BharatChain
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  India's First Sovereign Blockchain Network
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 3 }}>
                  Secure, transparent, and decentralized platform for digital India.
                  Store documents, verify credentials, and transact with complete trust.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ bgcolor: 'white', color: 'primary.main' }}
                    startIcon={<CloudUpload />}
                  >
                    Upload Document
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ borderColor: 'white', color: 'white' }}
                    startIcon={<Visibility />}
                  >
                    Explore Network
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <Typography variant="h6" align="center" gutterBottom>
                    Network Status
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={99.9}
                    sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" align="center">
                    99.9% Uptime • 2,847 Active Nodes
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                    <AccountBalance />
                  </Avatar>
                  <Typography variant="h4" color="primary">
                    {blockchainStats.totalTransactions}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                    <Speed />
                  </Avatar>
                  <Typography variant="h4" color="secondary">
                    {blockchainStats.activeNodes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Nodes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                    <Storage />
                  </Avatar>
                  <Typography variant="h4" color="info.main">
                    {blockchainStats.dataStored}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Data Stored
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                    <VerifiedUser />
                  </Avatar>
                  <Typography variant="h4" color="success.main">
                    {blockchainStats.uptime}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Network Uptime
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Feature Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Security />
                    </Avatar>
                    <Typography variant="h6">
                      Secure Document Storage
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Store your important documents on a decentralized network with 
                    military-grade encryption. Access from anywhere, anytime.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<CloudUpload />}
                  >
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <VerifiedUser />
                    </Avatar>
                    <Typography variant="h6">
                      Identity Verification
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Verify credentials instantly using blockchain technology. 
                    Trusted by government agencies and private institutions.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<Badge />}
                  >
                    Verify Identity
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <Timeline />
                    </Avatar>
                    <Typography variant="h6">
                      Transaction Analytics
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Track all your blockchain transactions with detailed analytics 
                    and real-time monitoring of network activities.
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="info"
                    startIcon={<Visibility />}
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
