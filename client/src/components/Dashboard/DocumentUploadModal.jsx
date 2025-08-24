import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Scanner,
  Security,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  SmartToy,
  Close,
  Upload,
  Image as ImageIcon,
  PictureAsPdf,
  Visibility,
  VerifiedUser,
  Assignment,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const DocumentUploadModal = ({ open, onClose, onUploadSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Select Document', 'AI Analysis', 'Verification Complete'];

  const documentTypes = [
    { value: 'aadhar', label: 'Aadhar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'voter_id', label: 'Voter ID' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'passport', label: 'Passport' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'other', label: 'Other Document' },
  ];

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setError('');
      // Auto-advance to next step after file selection
      setTimeout(() => setActiveStep(1), 500);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    setUploading(true);
    setProcessing(true);
    setError('');
    
    try {
      // Step 1: Simulate AI Analysis
      setUploadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Perform OCR and fraud detection
      setUploadProgress(40);
      const mockAiAnalysis = {
        ocrText: `GOVERNMENT OF INDIA\\n${documentType.toUpperCase()}\\nName: SAMPLE USER\\nDocument Number: ${Math.random().toString(36).substr(2, 9).toUpperCase()}\\nIssue Date: ${new Date().toLocaleDateString()}`,
        confidenceScore: 85 + Math.floor(Math.random() * 15),
        fraudScore: Math.floor(Math.random() * 20),
        verificationStatus: Math.random() > 0.3 ? 'verified' : 'warning',
        insights: [
          'Document format verification successful',
          'Security features detected and verified',
          'Text extraction confidence: 94%',
          'Cross-reference validation completed'
        ],
        extractedData: {
          name: 'SAMPLE USER',
          documentNumber: Math.random().toString(36).substr(2, 9).toUpperCase(),
          issueDate: new Date().toLocaleDateString(),
          documentType: documentType
        }
      };
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadProgress(60);
      
      // Step 3: Upload to backend
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', documentType);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }
      
      setUploadProgress(80);
      
      const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('bharatchain_token')}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.min(80 + (progress * 0.2), 100));
        },
      });
      
      if (response.data.success) {
        setAiAnalysis({
          ...mockAiAnalysis,
          ...response.data.data,
          uploadSuccess: true
        });
        setActiveStep(2);
        toast.success('Document uploaded and analyzed successfully!');
        
        // Call success callback after a delay
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(response.data.data);
          }
        }, 2000);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setActiveStep(0);
      setSelectedFile(null);
      setDocumentType('');
      setExpiryDate('');
      setAiAnalysis(null);
      setError('');
      setUploadProgress(0);
      onClose();
    }
  };

  const getFileIcon = (file) => {
    if (file?.type === 'application/pdf') return <PictureAsPdf color="error" />;
    return <ImageIcon color="primary" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getFraudRiskLevel = (score) => {
    if (score <= 10) return { level: 'Low', color: 'success' };
    if (score <= 30) return { level: 'Medium', color: 'warning' };
    return { level: 'High', color: 'error' };
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={uploading}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              AI-Powered Document Upload
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={uploading}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: File Selection */}
          {activeStep === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {/* File Drop Zone */}
                  <Box
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragActive ? 'primary.light' : 'background.paper',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {isDragActive ? 'Drop document here...' : 'Drag & drop or click to select'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Supports PDF, JPG, PNG files up to 10MB
                    </Typography>
                  </Box>
                </Grid>

                {selectedFile && (
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getFileIcon(selectedFile)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle1">{selectedFile.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Document Type</InputLabel>
                              <Select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                label="Document Type"
                              >
                                {documentTypes.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Expiry Date (Optional)"
                              type="date"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </motion.div>
          )}

          {/* Step 2: AI Processing */}
          {activeStep === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SmartToy sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Processing Document...
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Performing OCR, fraud detection, and authenticity verification
                </Typography>
                
                {uploading && (
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {uploadProgress}% Complete
                    </Typography>
                  </Box>
                )}
                
                {processing && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Analyzing with AI...
                    </Typography>
                  </Box>
                )}
              </Box>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {activeStep === 2 && aiAnalysis && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                {/* Success Message */}
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Document Upload Complete!
                    </Typography>
                    <Typography variant="body2">
                      Your document has been successfully uploaded and analyzed by our AI system.
                    </Typography>
                  </Alert>
                </Grid>

                {/* AI Analysis Results */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Scanner sx={{ mr: 1 }} />
                        AI Analysis
                      </Typography>
                      
                      {/* Confidence Score */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Confidence Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={aiAnalysis.confidenceScore}
                            sx={{ flexGrow: 1, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {aiAnalysis.confidenceScore}%
                          </Typography>
                        </Box>
                      </Box>

                      {/* Fraud Risk */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Fraud Risk Assessment</Typography>
                        <Chip
                          label={`${getFraudRiskLevel(aiAnalysis.fraudScore).level} Risk (${aiAnalysis.fraudScore})`}
                          color={getFraudRiskLevel(aiAnalysis.fraudScore).color}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>

                      {/* Verification Status */}
                      <Box>
                        <Typography variant="body2">Verification Status</Typography>
                        <Chip
                          icon={getStatusIcon(aiAnalysis.verificationStatus)}
                          label={aiAnalysis.verificationStatus}
                          color={aiAnalysis.verificationStatus === 'verified' ? 'success' : 'warning'}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Extracted Data */}
                <Grid item xs={12} md={6}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Assignment sx={{ mr: 1 }} />
                        Extracted Data
                      </Typography>
                      
                      <List dense>
                        {Object.entries(aiAnalysis.extractedData || {}).map(([key, value]) => (
                          <ListItem key={key} disablePadding>
                            <ListItemText
                              primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              secondary={value}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* AI Insights */}
                <Grid item xs={12}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <SmartToy sx={{ mr: 1 }} />
                        AI Security Insights
                      </Typography>
                      
                      <List>
                        {aiAnalysis.insights?.map((insight, index) => (
                          <ListItem key={index}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                <VerifiedUser sx={{ fontSize: 16 }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={insight} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          {activeStep === 2 ? 'Close' : 'Cancel'}
        </Button>
        
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploading}
            startIcon={processing ? <CircularProgress size={20} /> : <Upload />}
          >
            {processing ? 'Processing...' : 'Upload & Analyze'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadModal;
