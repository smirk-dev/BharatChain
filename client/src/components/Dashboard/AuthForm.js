import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Fade
} from '@mui/material';
import {
  AccountBalanceWallet,
  Security,
  Verified,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';

const AuthForm = () => {
  const { connectWallet, isConnecting, error, isMetaMaskInstalled } = useWeb3();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Install MetaMask',
    'Connect Wallet', 
    'Sign Message',
    'Access Platform'
  ];

  const handleConnect = async () => {
    try {
      setCurrentStep(1);
      await connectWallet();
      setCurrentStep(3);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card 
        sx={{ 
          maxWidth: 600, 
          mx: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AccountBalanceWallet sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Secure access to BharatChain using your MetaMask wallet
            </Typography>
          </Box>

          {/* Connection Steps */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Error Display */}
          {error && (
            <Fade in={Boolean(error)}>
              <Alert 
                severity="error" 
                icon={<ErrorIcon />}
                sx={{ mb: 3 }}
                onClose={() => {}}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {error}
                </Typography>
              </Alert>
            </Fade>
          )}

          {/* MetaMask Not Installed */}
          {!isMetaMaskInstalled() ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  MetaMask wallet is not detected. Please install MetaMask to continue.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleInstallMetaMask}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #f6851b 30%, #e2761b 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #e2761b 30%, #d6691b 90%)',
                  }
                }}
              >
                Install MetaMask
              </Button>
            </motion.div>
          ) : (
            /* MetaMask Available */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Security Features */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  🔒 Security Features
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    {
                      icon: <Security sx={{ color: 'success.main' }} />,
                      title: 'Wallet-Based Authentication',
                      description: 'No passwords needed. Your wallet is your identity.'
                    },
                    {
                      icon: <Verified sx={{ color: 'primary.main' }} />,
                      title: 'Cryptographic Signatures',
                      description: 'Message signing ensures secure authentication.'
                    },
                    {
                      icon: <AccountBalanceWallet sx={{ color: 'info.main' }} />,
                      title: 'No Gas Fees',
                      description: 'Authentication is free and requires no transactions.'
                    }
                  ].map((feature, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        p: 2,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    >
                      {feature.icon}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Connect Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleConnect}
                disabled={isConnecting}
                startIcon={
                  isConnecting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AccountBalanceWallet />
                  )
                }
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: isConnecting 
                    ? 'linear-gradient(45deg, #90a4ae 30%, #78909c 90%)'
                    : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: isConnecting
                      ? 'linear-gradient(45deg, #90a4ae 30%, #78909c 90%)'
                      : 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(45deg, #90a4ae 30%, #78909c 90%)',
                    color: 'white'
                  }
                }}
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask Wallet'}
              </Button>

              {/* Help Text */}
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ mt: 2, textAlign: 'center' }}
              >
                By connecting, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </motion.div>
          )}

          {/* Additional Info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              New to MetaMask? 
              <Button 
                variant="text" 
                size="small" 
                onClick={() => window.open('https://metamask.io/faqs/', '_blank')}
                sx={{ ml: 1, textTransform: 'none' }}
              >
                Learn more about wallet security
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AuthForm;
