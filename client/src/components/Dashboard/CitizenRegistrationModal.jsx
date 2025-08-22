import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Person,
  Badge,
  Phone,
  AccountCircle,
  Security,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const CitizenRegistrationModal = ({ 
  open, 
  onClose, 
  onSubmit, 
  loading = false, 
  error = null,
  walletAddress 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    aadharNumber: '',
    phoneNumber: '',
    walletAddress: walletAddress ? walletAddress.toString().trim().toLowerCase() : ''
  });

  const [errors, setErrors] = useState({});

  const steps = [
    'Personal Information',
    'Verification Details',
    'Confirmation'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Full name is required';
        }
        if (!formData.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = 'Phone number must be 10 digits';
        }
        break;
      case 1:
        if (!formData.aadharNumber.trim()) {
          newErrors.aadharNumber = 'Aadhar number is required';
        } else if (!/^\d{12}$/.test(formData.aadharNumber)) {
          newErrors.aadharNumber = 'Aadhar number must be 12 digits';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleSubmit = () => {
    if (validateStep(1)) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      fullName: '',
      aadharNumber: '',
      phoneNumber: '',
      walletAddress: walletAddress ? walletAddress.toString().trim().toLowerCase() : ''
    });
    setErrors({});
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                error={!!errors.fullName}
                helperText={errors.fullName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                placeholder="1234567890"
                required
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Your Aadhar number will be used for identity verification. This information is encrypted and secure.
              </Alert>
              <TextField
                fullWidth
                label="Aadhar Number"
                value={formData.aadharNumber}
                onChange={handleInputChange('aadharNumber')}
                error={!!errors.aadharNumber}
                helperText={errors.aadharNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                placeholder="123456789012"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wallet Address"
                value={formData.walletAddress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle />
                    </InputAdornment>
                  ),
                  readOnly: true
                }}
                variant="outlined"
                helperText="Connected wallet address (auto-filled)"
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              Confirm Registration Details
            </Typography>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ mt: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.fullName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.phoneNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Aadhar Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {'*'.repeat(8) + formData.aadharNumber.slice(-4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Wallet Address
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>
                      {formData.walletAddress.slice(0, 6)}...{formData.walletAddress.slice(-4)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip icon={<Security />} label="Secure" color="success" size="small" />
                  <Chip icon={<CheckCircle />} label="Verified" color="primary" size="small" />
                </Box>
              </CardContent>
            </MotionCard>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Citizen Registration
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
          Complete your registration to access BharatChain services
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography sx={{ color: 'white' }}>{label}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 2, 
                  p: 2, 
                  mt: 1,
                  backdropFilter: 'blur(10px)'
                }}>
                  {renderStepContent(index)}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          sx={{ color: 'white', borderColor: 'white' }}
          variant="outlined"
        >
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button 
            onClick={handleBack}
            sx={{ color: 'white', borderColor: 'white' }}
            variant="outlined"
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
              }
            }}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4CAF50 60%, #45a049 100%)',
              }
            }}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CitizenRegistrationModal;
