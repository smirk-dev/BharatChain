import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Visibility,
  Download,
  SmartToy,
  Analytics,
  Fingerprint,
  VerifiedUser,
  Assignment,
  Upload,
  Image as ImageIcon,
  PictureAsPdf,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const AIDocumentProcessor = () => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedDocuments, setProcessedDocuments] = useState([]);
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Demo processed documents
  const demoDocuments = [
    {
      id: 1,
      filename: 'aadhar_card.pdf',
      type: 'Identity Document',
      uploadDate: '2025-08-13',
      ocrText: 'AADHAAR\nGovernment of India\nName: RAJESH KUMAR\nDOB: 15/03/1985\nGender: MALE\nAddress: 123 MG Road, New Delhi - 110001',
      fraudScore: 5,
      confidenceScore: 97,
      verificationStatus: 'verified',
      aiInsights: [
        'Document format matches official Aadhar template',
        'Security features detected and verified',
        'Text extraction confidence: 97%',
        'No signs of tampering detected'
      ],
      extractedData: {
        name: 'RAJESH KUMAR',
        dob: '15/03/1985',
        gender: 'MALE',
        aadharNumber: 'XXXX XXXX 1234',
        address: '123 MG Road, New Delhi - 110001'
      }
    },
    {
      id: 2,
      filename: 'pan_card.jpg',
      type: 'Tax Document',
      uploadDate: '2025-08-12',
      ocrText: 'INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER CARD\nName: RAJESH KUMAR\nFather\'s Name: SURESH KUMAR\nDate of Birth: 15/03/1985\nPAN: ABCDE1234F',
      fraudScore: 12,
      confidenceScore: 89,
      verificationStatus: 'warning',
      aiInsights: [
        'Minor discrepancies in document quality',
        'Cross-verification needed with Aadhar data',
        'Image quality could be improved',
        'Format verification successful'
      ],
      extractedData: {
        name: 'RAJESH KUMAR',
        fatherName: 'SURESH KUMAR',
        dob: '15/03/1985',
        panNumber: 'ABCDE1234F'
      }
    },
    {
      id: 3,
      filename: 'driving_license.png',
      type: 'License Document',
      uploadDate: '2025-08-10',
      ocrText: 'DRIVING LICENCE\nMinistry of Road Transport & Highways\nName: RAJESH KUMAR\nDL No: DL-1320110012345\nIssue Date: 10/05/2020\nValid Till: 09/05/2040',
      fraudScore: 3,
      confidenceScore: 94,
      verificationStatus: 'verified',
      aiInsights: [
        'Valid driving license format detected',
        'Hologram and security features verified',
        'Date validation successful',
        'High confidence in authenticity'
      ],
      extractedData: {
        name: 'RAJESH KUMAR',
        dlNumber: 'DL-1320110012345',
        issueDate: '10/05/2020',
        validTill: '09/05/2040',
        vehicleClass: 'LMV'
      }
    }
  ];

  React.useEffect(() => {
    setProcessedDocuments(demoDocuments);
  }, []);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFiles(acceptedFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const processFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentProcessing(file.name);
      
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Simulate AI processing
      setProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate AI results
      const newDocument = {
        id: Date.now() + i,
        filename: file.name,
        type: getDocumentType(file.name),
        uploadDate: new Date().toISOString().split('T')[0],
        ocrText: simulateOCR(file.name),
        fraudScore: Math.floor(Math.random() * 20),
        confidenceScore: 85 + Math.floor(Math.random() * 15),
        verificationStatus: getRandomStatus(),
        aiInsights: generateInsights(),
        extractedData: simulateDataExtraction(file.name)
      };

      setProcessedDocuments(prev => [newDocument, ...prev]);
      setProcessing(false);
    }

    setUploading(false);
    setCurrentProcessing(null);
    setUploadProgress(0);
  };

  const getDocumentType = (filename) => {
    const types = ['Identity Document', 'Tax Document', 'License Document', 'Educational Certificate', 'Property Document'];
    return types[Math.floor(Math.random() * types.length)];
  };

  const simulateOCR = (filename) => {
    const samples = [
      'GOVERNMENT OF INDIA\nOFFICIAL DOCUMENT\nName: Sample Name\nDocument Number: 123456789',
      'CERTIFICATE\nThis is to certify that...\nOfficial Seal and Signature',
      'IDENTITY VERIFICATION\nPersonal Details\nAddress Information\nContact Details'
    ];
    return samples[Math.floor(Math.random() * samples.length)];
  };

  const getRandomStatus = () => {
    const statuses = ['verified', 'warning', 'pending'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const generateInsights = () => {
    const insights = [
      'Document format verification successful',
      'Security features detected',
      'High text extraction accuracy',
      'Cross-reference validation completed',
      'Tamper detection analysis passed',
      'Metadata verification successful'
    ];
    return insights.slice(0, 3 + Math.floor(Math.random() * 2));
  };

  const simulateDataExtraction = (filename) => {
    return {
      name: 'SAMPLE NAME',
      documentNumber: 'DOC' + Math.floor(Math.random() * 1000000),
      issueDate: '2023-01-01',
      validTill: '2033-01-01'
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'pending':
        return <CircularProgress size={20} />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'warning':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'error';
    }
  };

  const getFraudRiskLevel = (score) => {
    if (score <= 10) return { level: 'Low', color: 'success' };
    if (score <= 30) return { level: 'Medium', color: 'warning' };
    return { level: 'High', color: 'error' };
  };

  const getFileIcon = (filename) => {
    if (filename.includes('.pdf')) return <PictureAsPdf color="error" />;
    return <ImageIcon color="primary" />;
  };

  const viewDocument = (doc) => {
    setSelectedDocument(doc);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToy sx={{ mr: 2, color: 'primary.main' }} />
          AI Document Processing
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Advanced OCR, fraud detection, and document verification powered by AI
        </Typography>
      </Box>

      {/* Upload Area */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
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
              {isDragActive ? 'Drop files here...' : 'Drag & drop documents or click to select'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supports PDF, JPG, PNG files. AI will automatically extract text and verify authenticity.
            </Typography>
            
            {uploading && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Processing: {currentProcessing}
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
                {processing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">AI analyzing document...</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* AI Processing Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                <Scanner />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {processedDocuments.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Documents Processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                <VerifiedUser />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {processedDocuments.filter(d => d.verificationStatus === 'verified').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Verified Documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                <Analytics />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {Math.round(processedDocuments.reduce((acc, doc) => acc + doc.confidenceScore, 0) / processedDocuments.length) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg. Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                <Security />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {processedDocuments.filter(d => d.fraudScore <= 10).length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Low Risk Documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Processed Documents Table */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Processed Documents
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Fraud Risk</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedDocuments.map((doc) => {
                  const fraudRisk = getFraudRiskLevel(doc.fraudScore);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getFileIcon(doc.filename)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {doc.filename}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.uploadDate}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={doc.confidenceScore}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {doc.confidenceScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${fraudRisk.level} (${doc.fraudScore})`}
                          color={fraudRisk.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(doc.verificationStatus)}
                          label={doc.verificationStatus}
                          color={getStatusColor(doc.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => viewDocument(doc)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Document Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartToy sx={{ mr: 1 }} />
            AI Analysis Results - {selectedDocument?.filename}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Grid container spacing={3}>
              {/* OCR Text */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Extracted Text (OCR)
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>
                    {selectedDocument.ocrText}
                  </Typography>
                </Paper>
              </Grid>

              {/* Extracted Data */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Structured Data
                </Typography>
                <List dense>
                  {Object.entries(selectedDocument.extractedData).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key.charAt(0).toUpperCase() + key.slice(1)}
                        secondary={value}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* AI Insights */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  AI Insights & Verification
                </Typography>
                <List>
                  {selectedDocument.aiInsights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <SmartToy sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={insight} />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Security Metrics */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Security Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 120 }}>
                        Confidence Score:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedDocument.confidenceScore}
                        sx={{ flexGrow: 1, mr: 1 }}
                      />
                      <Typography variant="body2">
                        {selectedDocument.confidenceScore}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 120 }}>
                        Fraud Risk:
                      </Typography>
                      <Chip
                        label={`${getFraudRiskLevel(selectedDocument.fraudScore).level} (${selectedDocument.fraudScore})`}
                        color={getFraudRiskLevel(selectedDocument.fraudScore).color}
                        size="small"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIDocumentProcessor;
