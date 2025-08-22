import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge,
  Tooltip,
  useTheme,
  useScrollTrigger,
  Slide,
} from '@mui/material';
import {
  AccountBalance,
  AccountBalanceWallet,
  VerifiedUser,
  ContentCopy,
  ExitToApp,
  Notifications,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useWeb3 } from '../../context/Web3Context';
import toast from 'react-hot-toast';

const Header = ({ 
  darkMode, 
  toggleDarkMode, 
  isAuthenticated, 
  authenticateWallet, 
  account: connectedAccount, 
  isConnected: walletConnected, 
  userProfile 
}) => {
  const theme = useTheme();
  const { user, logout, isVerified, userAddress } = useAuth();
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();
  
  const [walletMenu, setWalletMenu] = useState(null);
  const [userMenu, setUserMenu] = useState(null);

  const trigger = useScrollTrigger();

  // Use passed props or fallback to context
  const currentAccount = connectedAccount || account;
  const currentIsConnected = walletConnected !== undefined ? walletConnected : isConnected;

  // Handle wallet connection and authentication
  const handleWalletAction = async () => {
    if (!currentIsConnected) {
      // Connect wallet first
      if (connectWallet) {
        const result = await connectWallet();
        if (result?.success && authenticateWallet) {
          await authenticateWallet();
        }
      }
    } else if (!isAuthenticated && authenticateWallet) {
      // Wallet connected but not authenticated
      await authenticateWallet();
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

  const handleLogout = async () => {
    await logout();
    if (isConnected) {
      disconnectWallet();
    }
    setUserMenu(null);
  };

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backdropFilter: 'blur(20px)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 18, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                background: 'linear-gradient(45deg, #FF6D00 30%, #138808 90%)',
                width: 40, 
                height: 40 
              }}
            >
              <AccountBalance />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #FF6D00 30%, #138808 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                BharatChain
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  display: 'block',
                  lineHeight: 1
                }}
              >
                Digital Governance
              </Typography>
            </Box>
          </Box>

          {/* Actions Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Dark Mode Toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={0} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Wallet Connection */}
            {currentIsConnected ? (
              <>
                <Tooltip title={isAuthenticated ? "Wallet Authenticated" : "Click to Authenticate"}>
                  <Chip
                    icon={isAuthenticated ? <VerifiedUser /> : <AccountBalanceWallet />}
                    label={formatAddress(currentAccount)}
                    color={isAuthenticated ? "success" : "warning"}
                    variant={isAuthenticated ? "filled" : "outlined"}
                    size="small"
                    onClick={isAuthenticated ? (e) => setWalletMenu(e.currentTarget) : handleWalletAction}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  />
                </Tooltip>
                <Menu
                  anchorEl={walletMenu}
                  open={Boolean(walletMenu)}
                  onClose={() => setWalletMenu(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {account}
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    copyToClipboard(account);
                    setWalletMenu(null);
                  }}>
                    <ContentCopy sx={{ mr: 1 }} fontSize="small" />
                    Copy Address
                  </MenuItem>
                  <MenuItem onClick={() => {
                    disconnectWallet();
                    setWalletMenu(null);
                  }}>
                    Disconnect Wallet
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWallet />}
                onClick={connectWallet}
                size="small"
              >
                Connect Wallet
              </Button>
            )}

            {/* User Menu */}
            <Tooltip title="User Menu">
              <IconButton onClick={(e) => setUserMenu(e.currentTarget)}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: isVerified ? 'success.main' : 'warning.main'
                  }}
                >
                  <VerifiedUser fontSize="small" />
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenu}
              open={Boolean(userMenu)}
              onClose={() => setUserMenu(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2">
                    {user?.name || formatAddress(userAddress)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isVerified ? '✅ Verified' : '⏳ Pending'}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} fontSize="small" />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </Slide>
  );
};

export default Header;
