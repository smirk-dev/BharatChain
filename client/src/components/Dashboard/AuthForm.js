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
} from '@mui/material';
import {
  AccountBalanceWallet,
  ContentCopy,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../../context/Web3Context';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AuthForm({ onSubmit, type }) {
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

  const renderConnectStep = () => (
    <Stack spacing={3} alignItems="center">
      <AccountBalanceWallet sx={{ fontSize: 60, color: 'primary.main' }} />
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Connect Your Wallet
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center">
        Connect your MetaMask wallet to access BharatChain services
      </Typography>
      
      {!window.ethereum ? (
        <Alert severity="warning">
          MetaMask is not installed. Please install MetaMask to continue.
        </Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={handleConnectWallet}
          disabled={web3Loading || loading}
          startIcon={web3Loading || loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
          sx={{ minWidth: 200 }}
        >
          {web3Loading || loading ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      )}
    </Stack>
  );

  const renderSignStep = () => (
    <Stack spacing={3}>
      <Box textAlign="center">
        <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" component="h1" gutterBottom>
          Sign Message
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connected: {formatAddress(account)}
          <IconButton size="small" onClick={() => copyToClipboard(account)}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </Typography>
      </Box>

      <Alert severity="info">
        <Typography variant="body2">
          Please sign this message to prove ownership of your wallet. 
          This will not cost any gas fees.
        </Typography>
      </Alert>

      <TextField
        multiline
        rows={6}
        value={authMessage}
        variant="outlined"
        fullWidth
        InputProps={{ readOnly: true }}
        sx={{ 
          '& .MuiInputBase-input': { 
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }
        }}
      />

      <Button
        variant="contained"
        size="large"
        onClick={handleSignMessage}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Signing...' : 'Sign Message'}
      </Button>

      <Button
        variant="outlined"
        onClick={() => setStep('connect')}
        disabled={loading}
      >
        Back
      </Button>
    </Stack>
  );

  const renderSuccessStep = () => (
    <Stack spacing={3} alignItems="center">
      <CheckCircle sx={{ fontSize: 60, color: 'success.main' }} />
      <Typography variant="h5" component="h1" gutterBottom>
        Welcome to BharatChain!
      </Typography>
      
      {userInfo && (
        <Box sx={{ width: '100%' }}>
          <Typography variant="h6" gutterBottom>Account Information:</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Address:</strong> {formatAddress(userInfo.address)}
              <IconButton size="small" onClick={() => copyToClipboard(userInfo.address)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Typography>
            <Typography variant="body2">
              <strong>Registration Status:</strong> {userInfo.isRegistered ? '✅ Registered' : '❌ Not Registered'}
            </Typography>
            <Typography variant="body2">
              <strong>Verification Status:</strong> {userInfo.isVerified ? '✅ Verified' : '⏳ Pending'}
            </Typography>
            {userInfo.name && (
              <Typography variant="body2">
                <strong>Name:</strong> {userInfo.name}
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {userInfo && !userInfo.isRegistered && (
        <Alert severity="warning">
          You need to register as a citizen to access all BharatChain services.
        </Alert>
      )}
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {step === 'connect' && renderConnectStep()}
          {step === 'sign' && renderSignStep()}
          {step === 'success' && renderSuccessStep()}

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            BharatChain uses Web3 authentication for secure, decentralized access
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
