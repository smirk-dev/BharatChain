import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  IconButton,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  CheckCircle,
  Error as ErrorIcon,
  AccountBalance,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

export default function AuthForm({ onSubmit, type }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('connect'); // connect, sign, success
  const [authMessage, setAuthMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  const { 
    account, 
    isConnected, 
    connectWallet, 
    provider,
    loading: web3Loading 
  } = useWeb3();

  useEffect(() => {
    if (isConnected && account && step === 'connect') {
      handleGetAuthMessage();
    }
  }, [isConnected, account, step]);

  const handleGetAuthMessage = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/message`, {
        address: account
      });

      if (response.data.success) {
        setAuthMessage(response.data.data.message);
        setStep('sign');
      } else {
        setError(response.data.message || 'Failed to get authentication message');
      }
    } catch (err) {
      console.error('Error getting auth message:', err);
      setError('Failed to get authentication message');
    } finally {
      setLoading(false);
    }
  };

  const handleSignMessage = async () => {
    try {
      setLoading(true);
      setError('');

      if (!provider || !account) {
        setError('Wallet not connected');
        return;
      }

      // Get signer from provider
      const signer = await provider.getSigner();
      
      // Sign the message
      const signature = await signer.signMessage(authMessage);

      // Send to backend for verification
      const response = await axios.post(`${API_BASE_URL}/api/auth/connect`, {
        address: account,
        signature: signature,
        message: authMessage
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('bharatchain_token', token);
        
        setUserInfo(user);
        setStep('success');
        
        toast.success('Successfully authenticated!');
        
        // Call parent onSubmit with user data
        if (onSubmit) {
          onSubmit({ 
            success: true, 
            token, 
            user,
            type: 'web3'
          });
        }
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Error signing message:', err);
      if (err.code === 4001) {
        setError('User rejected the signature request');
      } else {
        setError('Failed to sign message or authenticate');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (err) {
      setError('Failed to connect wallet');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.2, duration: 0.5, ease: "easeOut" }
    }
  };

  const renderConnectStep = () => (
    <Stack spacing={4} alignItems="center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            mb: 2
          }}
        >
          <AccountBalance sx={{ fontSize: 40 }} />
        </Avatar>
      </motion.div>

      <Box textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome to BharatChain
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Digital Governance Platform
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          Connect your MetaMask wallet to access secure, blockchain-powered 
          citizen services and participate in transparent governance.
        </Typography>
      </Box>
      
      {!window.ethereum ? (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': { textAlign: 'center', width: '100%' }
          }}
        >
          <Typography variant="body2">
            MetaMask is not installed. Please install MetaMask to continue.
          </Typography>
        </Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={handleConnectWallet}
          disabled={web3Loading || loading}
          startIcon={web3Loading || loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
          sx={{ 
            minWidth: 220,
            height: 48,
            fontSize: '1.1rem',
            borderRadius: 3,
          }}
        >
          {web3Loading || loading ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
        <Box sx={{ width: 40, height: 1, bgcolor: 'divider' }} />
        <Typography variant="body2" color="text.secondary">
          Secure • Transparent • Decentralized
        </Typography>
        <Box sx={{ width: 40, height: 1, bgcolor: 'divider' }} />
      </Box>
    </Stack>
  );

  const renderSignStep = () => (
    <Stack spacing={3}>
      <Box textAlign="center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        </motion.div>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Sign Authentication Message
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="body1" color="text.secondary">
            Connected: {formatAddress(account)}
          </Typography>
          <IconButton size="small" onClick={() => copyToClipboard(account)}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Alert 
        severity="info" 
        sx={{ 
          borderRadius: 2,
          bgcolor: `${theme.palette.info.main}10`,
          border: `1px solid ${theme.palette.info.main}30`
        }}
      >
        <Typography variant="body2">
          Please sign this message to prove ownership of your wallet. 
          This will not cost any gas fees and is completely secure.
        </Typography>
      </Alert>

      <TextField
        multiline
        rows={6}
        value={authMessage}
        variant="outlined"
        fullWidth
        InputProps={{ 
          readOnly: true,
          sx: { borderRadius: 2 }
        }}
        sx={{ 
          '& .MuiInputBase-input': { 
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
          }
        }}
      />

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={() => setStep('connect')}
          disabled={loading}
          size="large"
          sx={{ borderRadius: 2, flex: 1 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleSignMessage}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ borderRadius: 2, flex: 2 }}
        >
          {loading ? 'Signing...' : 'Sign Message'}
        </Button>
      </Stack>
    </Stack>
  );

  const renderSuccessStep = () => (
    <Stack spacing={4} alignItems="center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
      </motion.div>
      
      <Box textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          🎉 Welcome to BharatChain!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Authentication successful
        </Typography>
      </Box>
      
      {userInfo && (
        <Card 
          elevation={0}
          sx={{ 
            width: '100%', 
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalanceWallet color="primary" />
              Account Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Address</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {formatAddress(userInfo.address)}
                  </Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(userInfo.address)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2">
                  <strong>Registration:</strong> {userInfo.isRegistered ? '✅ Registered' : '❌ Not Registered'}
                </Typography>
                <Typography variant="body2">
                  <strong>Verification:</strong> {userInfo.isVerified ? '✅ Verified' : '⏳ Pending'}
                </Typography>
              </Box>
              
              {userInfo.name && (
                <Typography variant="body2">
                  <strong>Name:</strong> {userInfo.name}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {userInfo && !userInfo.isRegistered && (
        <Alert 
          severity="warning"
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%', textAlign: 'center' }
          }}
        >
          <Typography variant="body2">
            You need to register as a citizen to access all BharatChain services.
          </Typography>
        </Alert>
      )}
    </Stack>
  );

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decorations */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(180deg)' }
          }
        }}
      />
      
      <MotionCard 
        variants={cardVariants}
        sx={{ 
          maxWidth: 600, 
          width: '100%',
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(26, 26, 26, 0.9)'
            : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }} 
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </motion.div>
          )}

          {step === 'connect' && renderConnectStep()}
          {step === 'sign' && renderSignStep()}
          {step === 'success' && renderSuccessStep()}

          <Divider sx={{ my: 4 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            BharatChain uses Web3 authentication for secure, decentralized access to government services
          </Typography>
        </CardContent>
      </MotionCard>
    </MotionBox>
  );
}
