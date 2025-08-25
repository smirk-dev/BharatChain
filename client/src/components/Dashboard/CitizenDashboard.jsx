import React, { useState, useEffect, Fragment } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  Avatar,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  ReportProblem as GrievanceIcon,
  Psychology as PsychologyIcon,
  Verified,
  TrendingUp,
  Speed,
  Security,
  Refresh,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera,
  LocationOn,
  Email,
  Phone,
  Work,
  School,
  AccountBalance,
  CloudUpload,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  AttachFile,
  PictureAsPdf,
  Image as ImageIcon,
  InsertDriveFile,
  Close as CloseIcon,
  CloudDownload,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Analytics as AnalyticsIcon,
  TextSnippet as TextIcon,
  Psychology as BrainIcon,
  AutoAwesome as MagicIcon,
  TrendingUp as TrendIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from '../../context/Web3Context';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </motion.div>
      )}
    </div>
  );
}

const CitizenDashboard = () => {
  const { account, isConnected } = useWeb3();
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingGrievances: 0,
    resolvedGrievances: 0
  });

  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    panNumber: '',
    occupation: '',
    education: '',
    dateOfBirth: '',
    gender: '',
    emergencyContact: '',
    isVerified: false,
    profileImage: null
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Document state
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [documentsSuccess, setDocumentsSuccess] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    type: '',
    description: '',
    file: null,
    isPublic: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Grievances state
  const [grievances, setGrievances] = useState([]);
  const [grievancesLoading, setGrievancesLoading] = useState(false);
  const [grievancesError, setGrievancesError] = useState(null);
  const [grievancesSuccess, setGrievancesSuccess] = useState(null);
  const [grievanceDialogOpen, setGrievanceDialogOpen] = useState(false);
  const [grievanceViewDialogOpen, setGrievanceViewDialogOpen] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [grievanceData, setGrievanceData] = useState({
    title: '',
    description: '',
    category: 'DOCUMENTATION',
    priority: 'MEDIUM',
    department: ''
  });
  const [isSubmittingGrievance, setIsSubmittingGrievance] = useState(false);

  // AI Analysis state
  const [aiAnalysisMode, setAiAnalysisMode] = useState('document'); // 'document' or 'grievance'
  const [aiAnalysisFile, setAiAnalysisFile] = useState(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiError, setAiError] = useState(null);
  const [aiSuccess, setAiSuccess] = useState(null);
  const [aiAnalysisHistory, setAiAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [analysisDetailOpen, setAnalysisDetailOpen] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Profile functions
  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/citizens/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.citizen) {
          const profileData = {
            name: data.citizen.name || '',
            email: data.citizen.email || '',
            phone: data.citizen.phone || '',
            address: data.citizen.address || '',
            city: data.citizen.city || '',
            state: data.citizen.state || '',
            pincode: data.citizen.pincode || '',
            aadharNumber: data.citizen.aadharNumber || '',
            panNumber: data.citizen.panNumber || '',
            occupation: data.citizen.occupation || '',
            education: data.citizen.education || '',
            dateOfBirth: data.citizen.dateOfBirth || '',
            gender: data.citizen.gender || '',
            emergencyContact: data.citizen.emergencyContact || '',
            isVerified: data.citizen.isVerified || false,
            profileImage: data.citizen.profileImage || null
          };
          setProfile(profileData);
          setOriginalProfile(profileData);
        } else {
          // Profile doesn't exist, show empty form for new registration
          setProfile({
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            aadharNumber: '',
            panNumber: '',
            occupation: '',
            education: '',
            dateOfBirth: '',
            gender: '',
            emergencyContact: '',
            isVerified: false,
            profileImage: null
          });
        }
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileError('Failed to load profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleProfileSave = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileSuccess(null);

      // Validate required fields
      if (!profile.name || !profile.email || !profile.phone) {
        setProfileError('Please fill in all required fields (Name, Email, Phone)');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        setProfileError('Please enter a valid email address');
        return;
      }

      // Phone validation - format for isMobilePhone validation
      let formattedPhone = profile.phone.replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('+91')) {
        formattedPhone = formattedPhone.substring(3);
      } else if (formattedPhone.startsWith('91')) {
        formattedPhone = formattedPhone.substring(2);
      }
      
      if (!/^[6-9]\d{9}$/.test(formattedPhone)) {
        setProfileError('Please enter a valid Indian mobile number (10 digits starting with 6-9)');
        return;
      }

      // Create aadharHash from aadharNumber (in real app, this would be properly hashed)
      const aadharHash = profile.aadharNumber ? 
        `hash_${profile.aadharNumber.replace(/\s/g, '')}` : 
        `hash_${Date.now()}`;

      const requestBody = {
        walletAddress: account,
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: `+91${formattedPhone}`, // Format as international number
        aadharHash: aadharHash
      };

      const response = await fetch(`${API_BASE_URL}/api/citizens/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsEditingProfile(false);
        setOriginalProfile(profile);
        setProfileSuccess('Profile saved successfully!');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setProfileSuccess(null), 3000);
      } else {
        // Handle validation errors from backend
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(error => error.msg).join(', ');
          setProfileError(`Validation Error: ${errorMessages}`);
        } else {
          setProfileError(data.message || 'Failed to save profile');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfile(originalProfile);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Document functions
  const loadDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      
      if (!account) {
        setDocumentsError('Please connect your wallet to view documents');
        setDocuments([]);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/documents?address=${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocuments(data.data.documents || []);
        } else {
          setDocuments([]);
        }
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocumentsError('Failed to load documents. Please try again.');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleUploadDialog = () => {
    setUploadDialogOpen(true);
    setUploadData({
      title: '',
      type: '',
      description: '',
      file: null,
      isPublic: false
    });
    setDocumentsError(null);
    setDocumentsSuccess(null);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadData({
      title: '',
      type: '',
      description: '',
      file: null,
      isPublic: false
    });
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setDocumentsError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocumentsError('Only PDF, JPEG, PNG, and DOC/DOCX files are allowed');
        return;
      }

      setUploadData(prev => ({ ...prev, file }));
      setDocumentsError(null);
    }
  };

  const handleUploadDocument = async () => {
    try {
      // Validate form
      if (!uploadData.title || !uploadData.type || !uploadData.file) {
        setDocumentsError('Please fill in all required fields and select a file');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setDocumentsError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('type', uploadData.type);
      formData.append('description', uploadData.description);
      formData.append('isPublic', uploadData.isPublic);
      formData.append('document', uploadData.file);
      formData.append('walletAddress', account);

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setDocumentsSuccess('Document uploaded successfully!');
        handleCloseUploadDialog();
        loadDocuments(); // Reload documents list
        
        // Auto-hide success message
        setTimeout(() => setDocumentsSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setDocumentsError(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    if (!account) {
      setDocumentsError('Please connect your wallet to delete documents');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}?address=${account}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDocumentsSuccess('Document deleted successfully!');
        loadDocuments(); // Reload documents list
        setTimeout(() => setDocumentsSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setDocumentsError(error.message || 'Failed to delete document. Please try again.');
    }
  };

  const handleDownloadDocument = async (document) => {
    if (!account) {
      setDocumentsError('Please connect your wallet to download documents');
      return;
    }

    try {
      // Create a link to trigger download
      const downloadUrl = `/api/documents/${document.id}/download?address=${account}`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.originalName || document.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDocumentsSuccess('Download started!');
      setTimeout(() => setDocumentsSuccess(null), 2000);
    } catch (error) {
      console.error('Error downloading document:', error);
      setDocumentsError('Failed to download document. Please try again.');
    }
  };

  const getDocumentIcon = (type, mimeType) => {
    if (mimeType?.includes('pdf')) return <PictureAsPdf color="error" />;
    if (mimeType?.includes('image')) return <ImageIcon color="primary" />;
    if (type === 'aadhar' || type === 'pan' || type === 'passport') return <AccountBalance color="warning" />;
    return <InsertDriveFile color="action" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <CheckCircle />;
      case 'pending': return <PendingIcon />;
      case 'rejected': return <ErrorIcon />;
      default: return <PendingIcon />;
    }
  };

  // Grievances functions
  const loadGrievances = async () => {
    try {
      setGrievancesLoading(true);
      setGrievancesError(null);
      
      if (!account) {
        setGrievancesError('Please connect your wallet to view grievances');
        setGrievances([]);
        return;
      }
      
      const response = await fetch(`/api/grievances?address=${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGrievances(data.data.grievances || []);
          // Update stats
          setStats(prev => ({
            ...prev,
            pendingGrievances: data.data.stats.open + data.data.stats.inProgress,
            resolvedGrievances: data.data.stats.resolved + data.data.stats.closed
          }));
        } else {
          setGrievances([]);
        }
      } else {
        throw new Error('Failed to load grievances');
      }
    } catch (error) {
      console.error('Error loading grievances:', error);
      setGrievancesError('Failed to load grievances. Please try again.');
      setGrievances([]);
    } finally {
      setGrievancesLoading(false);
    }
  };

  const handleGrievanceDialog = () => {
    setGrievanceDialogOpen(true);
    setGrievanceData({
      title: '',
      description: '',
      category: 'DOCUMENTATION',
      priority: 'MEDIUM',
      department: ''
    });
    setGrievancesError(null);
    setGrievancesSuccess(null);
  };

  const handleGrievanceSubmit = async () => {
    if (!account) {
      setGrievancesError('Please connect your wallet to submit grievances');
      return;
    }

    if (!grievanceData.title.trim() || !grievanceData.description.trim()) {
      setGrievancesError('Please fill in all required fields');
      return;
    }

    if (grievanceData.title.length < 5 || grievanceData.description.length < 20) {
      setGrievancesError('Title must be at least 5 characters and description at least 20 characters');
      return;
    }

    try {
      setIsSubmittingGrievance(true);
      setGrievancesError(null);

      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...grievanceData,
          address: account
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGrievancesSuccess('Grievance submitted successfully!');
        setGrievanceDialogOpen(false);
        loadGrievances(); // Reload grievances
      } else {
        throw new Error(data.message || 'Failed to submit grievance');
      }
    } catch (error) {
      console.error('Error submitting grievance:', error);
      setGrievancesError(error.message || 'Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmittingGrievance(false);
    }
  };

  const handleDeleteGrievance = async (grievanceId) => {
    if (!account) {
      setGrievancesError('Please connect your wallet to delete grievances');
      return;
    }

    try {
      const response = await fetch(`/api/grievances/${grievanceId}?address=${account}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGrievancesSuccess('Grievance deleted successfully!');
        loadGrievances(); // Reload grievances
      } else {
        throw new Error(data.message || 'Failed to delete grievance');
      }
    } catch (error) {
      console.error('Error deleting grievance:', error);
      setGrievancesError(error.message || 'Failed to delete grievance. Please try again.');
    }
  };

  const handleViewGrievance = (grievance) => {
    setSelectedGrievance(grievance);
    setGrievanceViewDialogOpen(true);
  };

  const handleUpdateGrievanceStatus = async (grievanceId, status, resolution) => {
    if (!account) {
      setGrievancesError('Please connect your wallet to update grievance status');
      return;
    }

    try {
      const response = await fetch(`/api/grievances/${grievanceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          resolution,
          address: account
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGrievancesSuccess('Grievance status updated successfully!');
        loadGrievances(); // Reload grievances
        setGrievanceViewDialogOpen(false);
      } else {
        throw new Error(data.message || 'Failed to update grievance status');
      }
    } catch (error) {
      console.error('Error updating grievance status:', error);
      setGrievancesError(error.message || 'Failed to update grievance status. Please try again.');
    }
  };

  const getGrievanceStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'ESCALATED': return 'error';
      case 'OPEN': return 'default';
      default: return 'default';
    }
  };

  const getGrievanceStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle />;
      case 'CLOSED': return <CheckCircle />;
      case 'IN_PROGRESS': return <PendingIcon />;
      case 'ESCALATED': return <ErrorIcon />;
      case 'OPEN': return <PendingIcon />;
      default: return <PendingIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  // AI Analysis functions
  const mockAIDocumentAnalysis = async (file) => {
    // Simulate realistic AI processing
    const analysisSteps = [
      { step: 'Uploading file...', progress: 10 },
      { step: 'Extracting text...', progress: 30 },
      { step: 'Analyzing document...', progress: 60 },
      { step: 'Validating information...', progress: 80 },
      { step: 'Generating results...', progress: 100 }
    ];

    for (const stepData of analysisSteps) {
      setAiProgress(stepData.progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate realistic mock results based on file type
    const mockResults = {
      id: Date.now(),
      fileName: file.name,
      fileSize: file.size,
      analysisDate: new Date().toISOString(),
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      documentType: detectDocumentType(file.name),
      isValid: Math.random() > 0.2, // 80% valid documents
      extractedText: generateMockExtractedText(file.name),
      extractedData: generateMockExtractedData(file.name),
      fraudScore: Math.random() * 0.3, // Low fraud score
      recommendations: generateMockRecommendations(),
      processingTime: '2.3 seconds',
      aiModel: 'BharatChain-AI-v2.1'
    };

    return mockResults;
  };

  const mockAIGrievanceAnalysis = async (text) => {
    // Simulate AI processing for grievance text
    const analysisSteps = [
      { step: 'Analyzing text...', progress: 20 },
      { step: 'Detecting sentiment...', progress: 50 },
      { step: 'Categorizing issue...', progress: 80 },
      { step: 'Generating insights...', progress: 100 }
    ];

    for (const stepData of analysisSteps) {
      setAiProgress(stepData.progress);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const sentimentScore = Math.random() * 2 - 1; // -1 to 1
    const urgencyScore = Math.random();

    return {
      id: Date.now(),
      text: text,
      analysisDate: new Date().toISOString(),
      sentiment: {
        score: sentimentScore,
        label: sentimentScore < -0.3 ? 'Negative' : sentimentScore > 0.3 ? 'Positive' : 'Neutral',
        confidence: 0.8 + Math.random() * 0.15
      },
      urgency: {
        score: urgencyScore,
        level: urgencyScore > 0.7 ? 'High' : urgencyScore > 0.4 ? 'Medium' : 'Low'
      },
      suggestedCategory: ['DOCUMENTATION', 'VERIFICATION', 'TECHNICAL', 'POLICY'][Math.floor(Math.random() * 4)],
      suggestedPriority: urgencyScore > 0.7 ? 'HIGH' : urgencyScore > 0.4 ? 'MEDIUM' : 'LOW',
      keywords: extractKeywords(text),
      similarCases: Math.floor(Math.random() * 5),
      estimatedResolutionTime: urgencyScore > 0.7 ? '24-48 hours' : urgencyScore > 0.4 ? '3-5 days' : '1-2 weeks',
      processingTime: '1.8 seconds'
    };
  };

  const detectDocumentType = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('aadhar') || name.includes('aadhaar')) return 'aadhar';
    if (name.includes('pan')) return 'pan';
    if (name.includes('passport')) return 'passport';
    if (name.includes('license') || name.includes('dl')) return 'driving_license';
    if (name.includes('voter')) return 'voter_id';
    return 'other';
  };

  const generateMockExtractedText = (fileName) => {
    const templates = {
      aadhar: "भारत सरकार GOVERNMENT OF INDIA आधार AADHAAR 1234 5678 9012 जॉन डो John Doe पुरुष MALE जन्म तिथि DOB: 01/01/1990",
      pan: "INCOME TAX DEPARTMENT GOVT. OF INDIA PERMANENT ACCOUNT NUMBER ABCDE1234F John Doe 01/01/1990",
      passport: "Republic of India भारत गणराज्य PASSPORT पासपोर्ट Type/प्रकार P Country Code/देश कोड IND Passport No./पासपोर्ट संख्या A1234567",
      default: "This is sample extracted text from the uploaded document. The AI system has successfully processed the document and extracted relevant information."
    };

    const type = detectDocumentType(fileName);
    return templates[type] || templates.default;
  };

  const generateMockExtractedData = (fileName) => {
    const type = detectDocumentType(fileName);
    const baseData = {
      name: "John Doe",
      dateOfBirth: "01/01/1990",
      gender: "Male"
    };

    const typeSpecificData = {
      aadhar: {
        ...baseData,
        aadharNumber: "1234-5678-9012",
        address: "123 Sample Street, Mumbai, Maharashtra, 400001"
      },
      pan: {
        ...baseData,
        panNumber: "ABCDE1234F",
        fatherName: "Father Name"
      },
      passport: {
        ...baseData,
        passportNumber: "A1234567",
        placeOfBirth: "Mumbai",
        nationality: "Indian"
      },
      default: baseData
    };

    return typeSpecificData[type] || typeSpecificData.default;
  };

  const generateMockRecommendations = () => {
    const recommendations = [
      "Document appears to be authentic with high confidence score",
      "All required fields are clearly visible and readable",
      "No signs of tampering or forgery detected",
      "Document format matches official standards",
      "Recommended for verification approval"
    ];
    return recommendations.slice(0, 3 + Math.floor(Math.random() * 2));
  };

  const extractKeywords = (text) => {
    const commonKeywords = ['urgent', 'delay', 'problem', 'issue', 'help', 'application', 'document', 'verification', 'status'];
    const words = text.toLowerCase().split(/\s+/);
    return commonKeywords.filter(keyword => 
      words.some(word => word.includes(keyword))
    ).slice(0, 5);
  };

  const handleAIDocumentAnalysis = async () => {
    if (!aiAnalysisFile) {
      setAiError('Please select a file to analyze');
      return;
    }

    try {
      setAiProcessing(true);
      setAiProgress(0);
      setAiError(null);

      const results = await mockAIDocumentAnalysis(aiAnalysisFile);
      setAiResults(results);
      setAiAnalysisHistory(prev => [results, ...prev]);
      setAiSuccess('Document analysis completed successfully!');
      
      setTimeout(() => setAiSuccess(null), 3000);
    } catch (error) {
      setAiError('Failed to analyze document. Please try again.');
    } finally {
      setAiProcessing(false);
      setAiProgress(0);
    }
  };

  const handleAIGrievanceAnalysis = async () => {
    if (!aiAnalysisText.trim()) {
      setAiError('Please enter text to analyze');
      return;
    }

    try {
      setAiProcessing(true);
      setAiProgress(0);
      setAiError(null);

      const results = await mockAIGrievanceAnalysis(aiAnalysisText);
      setAiResults(results);
      setAiAnalysisHistory(prev => [results, ...prev]);
      setAiSuccess('Grievance analysis completed successfully!');
      
      setTimeout(() => setAiSuccess(null), 3000);
    } catch (error) {
      setAiError('Failed to analyze text. Please try again.');
    } finally {
      setAiProcessing(false);
      setAiProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAiAnalysisFile(file);
      setAiResults(null);
      setAiError(null);
    }
  };

  const resetAIAnalysis = () => {
    setAiAnalysisFile(null);
    setAiAnalysisText('');
    setAiResults(null);
    setAiError(null);
    setAiSuccess(null);
    setAiProgress(0);
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Positive') return 'success';
    if (sentiment === 'Negative') return 'error';
    return 'warning';
  };

  const getUrgencyColor = (level) => {
    if (level === 'High') return 'error';
    if (level === 'Medium') return 'warning';
    return 'success';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'success';
    if (confidence > 0.6) return 'warning';
    return 'error';
  };

  // Mock data loading
  useEffect(() => {
    if (isConnected && account) {
      setIsLoading(true);
      
      // Load stats and profile data
      Promise.all([
        // Load stats (keeping as mock for now)
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              totalDocuments: 5,
              verifiedDocuments: 3,
              pendingGrievances: 2,
              resolvedGrievances: 8
            });
          }, 500);
        }),
        // Load real profile data
        loadProfile(),
        // Load documents
        loadDocuments(),
        // Load grievances
        loadGrievances()
      ]).then(([statsData]) => {
        setStats(statsData);
        setIsLoading(false);
      }).catch((error) => {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      });
    }
  }, [isConnected, account]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Profile', icon: <PersonIcon /> },
    { label: 'Documents', icon: <DocumentIcon /> },
    { label: 'Grievances', icon: <GrievanceIcon /> },
    { label: 'AI Analysis', icon: <SmartToyIcon /> }
  ];

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Add new documents for verification',
      icon: <DocumentIcon />,
      action: () => setCurrentTab(2),
      color: 'primary'
    },
    {
      title: 'Submit Grievance',
      description: 'Report issues or complaints',
      icon: <GrievanceIcon />,
      action: () => setCurrentTab(3),
      color: 'secondary'
    },
    {
      title: 'AI Document Analysis',
      description: 'Advanced document processing',
      icon: <SmartToyIcon />,
      action: () => setCurrentTab(4),
      color: 'info'
    },
    {
      title: 'Update Profile',
      description: 'Manage your information',
      icon: <PersonIcon />,
      action: () => setCurrentTab(1),
      color: 'success'
    }
  ];

  return (
    <Container maxWidth="xl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome to BharatChain Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Connected as: {formatAddress(account)} 
            <Chip 
              label="Verified" 
              size="small" 
              icon={<Verified />}
              color="success" 
              sx={{ ml: 2 }} 
            />
          </Typography>
        </Box>
      </motion.div>

      {/* Loading Progress */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              fontWeight: 500
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                  fontWeight: 600
                }
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        <TabPanel key="dashboard" value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Statistics Cards */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'black' }}>
                📊 Overview Statistics
              </Typography>
            </Grid>

            {[
              {
                title: 'Total Documents',
                value: stats.totalDocuments,
                icon: <DocumentIcon sx={{ fontSize: 40 }} />,
                color: 'primary',
                trend: '+12%'
              },
              {
                title: 'Verified Documents',
                value: stats.verifiedDocuments,
                icon: <Verified sx={{ fontSize: 40 }} />,
                color: 'success',
                trend: '+8%'
              },
              {
                title: 'Pending Grievances',
                value: stats.pendingGrievances,
                icon: <GrievanceIcon sx={{ fontSize: 40 }} />,
                color: 'warning',
                trend: '-5%'
              },
              {
                title: 'Resolved Issues',
                value: stats.resolvedGrievances,
                icon: <TrendingUp sx={{ fontSize: 40 }} />,
                color: 'info',
                trend: '+25%'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      background: `linear-gradient(135deg, ${stat.color}.light 0%, ${stat.color}.main 50%, ${stat.color}.light 100%)`,
                      color: 'black',
                      '& .MuiTypography-root': {
                        color: 'black',
                        textShadow: 'none'
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'black'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {stat.icon}
                        <Chip 
                          label={stat.trend} 
                          size="small" 
                          sx={{ 
                            ml: 'auto',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            color: 'black',
                            fontWeight: 600
                          }} 
                        />
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, mt: 2 }}>
                🚀 Quick Actions
              </Typography>
            </Grid>

            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    sx={{ 
                      p: 2, 
                      height: '100%', 
                      cursor: 'pointer',
                      border: '2px solid transparent',
                      '&:hover': {
                        borderColor: `${action.color}.main`,
                        boxShadow: 6
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        color={action.color}
                        size="small"
                        sx={{ mt: 2 }}
                        startIcon={<AddIcon />}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* System Status */}
            <Grid item xs={12}>
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, color: 'black' }}>
                      🔧 System Status
                    </Typography>
                    <Tooltip title="Refresh Status">
                      <IconButton size="small" sx={{ color: 'black' }}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {[
                      { name: 'Blockchain Network', status: 'Connected', icon: <Security /> },
                      { name: 'IPFS Storage', status: 'Online', icon: <Speed /> },
                      { name: 'AI Processing', status: 'Available', icon: <SmartToyIcon /> },
                      { name: 'Document Verification', status: 'Active', icon: <Verified /> }
                    ].map((service, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          p: 2, 
                          background: 'linear-gradient(135deg, success.light 0%, success.main 100%)',
                          borderRadius: 2,
                          color: 'black',
                          '& .MuiTypography-root': {
                            color: 'black'
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'black'
                          }
                        }}>
                          {service.icon}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {service.name}
                            </Typography>
                            <Typography variant="caption">
                              {service.status}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Profile Tab */}
        <TabPanel key="profile" value={currentTab} index={1}>
          <Grid container spacing={3}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
                      👤 Citizen Profile
                    </Typography>
                    {!isEditingProfile ? (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleProfileEdit}
                        sx={{ ml: 2 }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleProfileCancel}
                          disabled={profileLoading}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {profileLoading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                    </Box>
                  )}

                  {profileError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError(null)}>
                      {profileError}
                    </Alert>
                  )}

                  {profileSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess(null)}>
                      {profileSuccess}
                    </Alert>
                  )}

                  {/* Profile Picture Section */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Avatar
                      src={profile.profileImage}
                      sx={{ width: 100, height: 100, mr: 3 }}
                    >
                      {profile.name ? profile.name.charAt(0).toUpperCase() : account ? account.charAt(2).toUpperCase() : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {profile.name || 'New User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Wallet: {formatAddress(account)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={profile.isVerified ? "Verified Citizen" : profile.name ? "Pending Verification" : "Profile Incomplete"}
                          color={profile.isVerified ? "success" : profile.name ? "warning" : "error"}
                          size="small"
                          icon={<Verified />}
                        />
                        {isEditingProfile && (
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<PhotoCamera />}
                          >
                            Upload Photo
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={handleImageUpload}
                            />
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* New User Welcome Message */}
                  {!profile.name && !isEditingProfile && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <strong>Welcome to BharatChain!</strong> Please click "Edit Profile" to complete your citizen registration and unlock all platform features.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name *"
                        value={profile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        required
                        error={isEditingProfile && !profile.name}
                        helperText={isEditingProfile && !profile.name ? "Name is required" : ""}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!isEditingProfile}>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={profile.gender}
                          label="Gender"
                          onChange={(e) => handleProfileChange('gender', e.target.value)}
                          variant={isEditingProfile ? "outlined" : "filled"}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                          <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Education"
                        value={profile.education}
                        onChange={(e) => handleProfileChange('education', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <School sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Occupation"
                        value={profile.occupation}
                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address *"
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        required
                        error={isEditingProfile && (!profile.email || (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)))}
                        helperText={
                          isEditingProfile && !profile.email 
                            ? "Email is required" 
                            : isEditingProfile && profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
                            ? "Please enter a valid email address"
                            : ""
                        }
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number *"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        required
                        error={isEditingProfile && (!profile.phone || (profile.phone && !/^(\+91|91)?[6-9]\d{9}$/.test(profile.phone.replace(/[\s\-()]/g, ''))))}
                        helperText={
                          isEditingProfile && !profile.phone 
                            ? "Phone number is required" 
                            : isEditingProfile && profile.phone && !/^(\+91|91)?[6-9]\d{9}$/.test(profile.phone.replace(/[\s\-()]/g, ''))
                            ? "Enter valid Indian mobile number (10 digits, starting with 6-9)"
                            : "Format: +91XXXXXXXXXX or 10 digits starting with 6-9"
                        }
                        placeholder="+91XXXXXXXXXX"
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Emergency Contact"
                        value={profile.emergencyContact}
                        onChange={(e) => handleProfileChange('emergencyContact', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1 }} />
                    Address Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        value={profile.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="City"
                        value={profile.city}
                        onChange={(e) => handleProfileChange('city', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="State"
                        value={profile.state}
                        onChange={(e) => handleProfileChange('state', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="PIN Code"
                        value={profile.pincode}
                        onChange={(e) => handleProfileChange('pincode', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Government IDs */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                    <AccountBalance sx={{ mr: 1 }} />
                    Government Identification
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Aadhar Number"
                        value={profile.aadharNumber}
                        onChange={(e) => handleProfileChange('aadharNumber', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        helperText="12-digit Aadhar number"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="PAN Number"
                        value={profile.panNumber}
                        onChange={(e) => handleProfileChange('panNumber', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        helperText="10-character PAN number"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Verification Status:</strong> Your identity documents are verified and secured on the blockchain.
                  </Alert>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date().toLocaleDateString()}
                    </Typography>
                    <Chip
                      label="Blockchain Verified"
                      color="success"
                      icon={<Verified />}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel key="documents" value={currentTab} index={2}>
          <Grid container spacing={3}>
            {/* Documents Header */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
                      📄 Document Management
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<CloudUpload />}
                      onClick={handleUploadDialog}
                      sx={{ ml: 2 }}
                    >
                      Upload Document
                    </Button>
                  </Box>

                  {documentsLoading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                    </Box>
                  )}

                  {documentsError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDocumentsError(null)}>
                      {documentsError}
                    </Alert>
                  )}

                  {documentsSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setDocumentsSuccess(null)}>
                      {documentsSuccess}
                    </Alert>
                  )}

                  <Typography variant="body1" color="text.secondary">
                    Securely store and manage your government documents on the blockchain. 
                    All documents are encrypted and verified for authenticity.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Document Statistics */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                {[
                  {
                    title: 'Total Documents',
                    value: documents.length,
                    icon: <DocumentIcon />,
                    color: 'primary'
                  },
                  {
                    title: 'Verified',
                    value: documents.filter(doc => doc.status === 'verified').length,
                    icon: <CheckCircle />,
                    color: 'success'
                  },
                  {
                    title: 'Pending',
                    value: documents.filter(doc => doc.status === 'pending').length,
                    icon: <PendingIcon />,
                    color: 'warning'
                  },
                  {
                    title: 'Storage Used',
                    value: `${(documents.reduce((acc, doc) => acc + (doc.size || 0), 0) / (1024 * 1024)).toFixed(1)}MB`,
                    icon: <CloudDownload />,
                    color: 'info'
                  }
                ].map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ color: `${stat.color}.main`, mr: 2 }}>
                            {stat.icon}
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stat.title}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Documents List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    📋 Your Documents
                  </Typography>

                  {documents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Documents Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload your first document to get started with BharatChain
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={handleUploadDialog}
                      >
                        Upload Your First Document
                      </Button>
                    </Box>
                  ) : (
                    <List>
                      {documents.map((document, index) => (
                        <Fragment key={document.id || `document-${index}`}>
                          <ListItem
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              mb: 2,
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'background.paper' }}>
                                {getDocumentIcon(document.type, document.mimeType)}
                              </Avatar>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {document.title}
                                  </Typography>
                                  <Chip
                                    label={document.status}
                                    size="small"
                                    color={getStatusColor(document.status)}
                                    icon={getStatusIcon(document.status)}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Type: {document.type} • Size: {((document.size || 0) / 1024).toFixed(1)}KB
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Uploaded: {new Date(document.uploadDate || Date.now()).toLocaleDateString()}
                                  </Typography>
                                  {document.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {document.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            
                            <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Document">
                                  <IconButton
                                    onClick={() => handleViewDocument(document)}
                                    size="small"
                                  >
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Download">
                                  <IconButton
                                    onClick={() => handleDownloadDocument(document)}
                                    size="small"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Delete">
                                  <IconButton
                                    onClick={() => handleDeleteDocument(document.id)}
                                    size="small"
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Upload Dialog */}
          <Dialog 
            open={uploadDialogOpen} 
            onClose={handleCloseUploadDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Upload Document</Typography>
                <IconButton onClick={handleCloseUploadDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Document Title *"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Aadhar Card, PAN Card, Passport"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type *</InputLabel>
                    <Select
                      value={uploadData.type}
                      label="Document Type *"
                      onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <MenuItem value="AADHAR">Aadhar Card</MenuItem>
                      <MenuItem value="PAN">PAN Card</MenuItem>
                      <MenuItem value="PASSPORT">Passport</MenuItem>
                      <MenuItem value="DRIVING_LICENSE">Driving License</MenuItem>
                      <MenuItem value="VOTER_ID">Voter ID</MenuItem>
                      <MenuItem value="BIRTH_CERTIFICATE">Birth Certificate</MenuItem>
                      <MenuItem value="OTHER">Education Certificate</MenuItem>
                      <MenuItem value="OTHER">Income Certificate</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={uploadData.isPublic}
                        onChange={(e) => setUploadData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      />
                    }
                    label="Make Public"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    multiline
                    rows={3}
                    placeholder="Add any additional notes about this document"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      border: '2px dashed',
                      borderColor: uploadData.file ? 'success.main' : 'grey.300',
                      bgcolor: uploadData.file ? 'success.light' : 'grey.50',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light'
                      }
                    }}
                    component="label"
                  >
                    <input
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {uploadData.file ? uploadData.file.name : 'Choose a file to upload'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supported: PDF, JPEG, PNG, DOC, DOCX (Max 10MB)
                    </Typography>
                    {uploadData.file && (
                      <Chip
                        label={`${(uploadData.file.size / 1024).toFixed(1)}KB`}
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Paper>
                </Grid>
                
                {isUploading && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="body2">{uploadProgress}%</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseUploadDialog} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUploadDocument}
                variant="contained"
                disabled={!uploadData.title || !uploadData.type || !uploadData.file || isUploading}
                startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog
            open={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Document Details</Typography>
                <IconButton onClick={() => setViewDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            {selectedDocument && (
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      {getDocumentIcon(selectedDocument.type, selectedDocument.mimeType)}
                      <Box>
                        <Typography variant="h6">{selectedDocument.title}</Typography>
                        <Chip
                          label={selectedDocument.status}
                          size="small"
                          color={getStatusColor(selectedDocument.status)}
                          icon={getStatusIcon(selectedDocument.status)}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                    <Typography variant="body1">{selectedDocument.type}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Size</Typography>
                    <Typography variant="body1">{((selectedDocument.size || 0) / 1024).toFixed(1)}KB</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Upload Date</Typography>
                    <Typography variant="body1">
                      {new Date(selectedDocument.uploadDate || Date.now()).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Visibility</Typography>
                    <Typography variant="body1">
                      {selectedDocument.isPublic ? 'Public' : 'Private'}
                    </Typography>
                  </Grid>
                  
                  {selectedDocument.description && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{selectedDocument.description}</Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
            )}
            
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedDocument && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownloadDocument(selectedDocument)}
                >
                  Download
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* Grievances Tab */}
        <TabPanel key="grievances" value={currentTab} index={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'black' }}>
                📝 Grievance Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleGrievanceDialog}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  }
                }}
              >
                Submit New Grievance
              </Button>
            </Box>

            {grievancesError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setGrievancesError(null)}>
                {grievancesError}
              </Alert>
            )}

            {grievancesSuccess && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setGrievancesSuccess(null)}>
                {grievancesSuccess}
              </Alert>
            )}

            {grievancesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {grievances.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ textAlign: 'center', py: 4 }}>
                      <CardContent>
                        <GrievanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Grievances Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          You haven't submitted any grievances yet. Submit your first grievance to get started.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={handleGrievanceDialog}
                        >
                          Submit Your First Grievance
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  grievances.map((grievance, index) => (
                    <Grid item xs={12} md={6} key={grievance.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card
                          sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 6
                            }
                          }}
                          onClick={() => handleViewGrievance(grievance)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, pr: 2 }}>
                                {grievance.title}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                  label={grievance.priority}
                                  color={getPriorityColor(grievance.priority)}
                                  size="small"
                                />
                                <Chip
                                  icon={getGrievanceStatusIcon(grievance.status)}
                                  label={grievance.status.replace('_', ' ')}
                                  color={getGrievanceStatusColor(grievance.status)}
                                  size="small"
                                />
                              </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {grievance.description.length > 150
                                ? `${grievance.description.substring(0, 150)}...`
                                : grievance.description
                              }
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Category: {grievance.category}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  Department: {grievance.department || 'Not Assigned'}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(grievance.submissionDate).toLocaleDateString()}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewGrievance(grievance);
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this grievance?')) {
                                    handleDeleteGrievance(grievance.id);
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </motion.div>

          {/* Submit Grievance Dialog */}
          <Dialog open={grievanceDialogOpen} onClose={() => setGrievanceDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                📝 Submit New Grievance
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={grievanceData.title}
                    onChange={(e) => setGrievanceData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of your grievance"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={grievanceData.category}
                      label="Category"
                      onChange={(e) => setGrievanceData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <MenuItem value="DOCUMENTATION">Documentation</MenuItem>
                      <MenuItem value="VERIFICATION">Verification</MenuItem>
                      <MenuItem value="TECHNICAL">Technical</MenuItem>
                      <MenuItem value="POLICY">Policy</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={grievanceData.priority}
                      label="Priority"
                      onChange={(e) => setGrievanceData(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Department (Optional)"
                    value={grievanceData.department}
                    onChange={(e) => setGrievanceData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Specific department if known"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={grievanceData.description}
                    onChange={(e) => setGrievanceData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of your grievance (minimum 20 characters)"
                    multiline
                    rows={4}
                    required
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setGrievanceDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleGrievanceSubmit}
                disabled={isSubmittingGrievance}
                startIcon={isSubmittingGrievance ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {isSubmittingGrievance ? 'Submitting...' : 'Submit Grievance'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Grievance Dialog */}
          <Dialog open={grievanceViewDialogOpen} onClose={() => setGrievanceViewDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                📋 Grievance Details
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {selectedGrievance && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {selectedGrievance.title}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                      <Typography variant="body1">{selectedGrievance.category}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                      <Chip 
                        label={selectedGrievance.priority} 
                        color={getPriorityColor(selectedGrievance.priority)} 
                        size="small" 
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        icon={getGrievanceStatusIcon(selectedGrievance.status)}
                        label={selectedGrievance.status.replace('_', ' ')} 
                        color={getGrievanceStatusColor(selectedGrievance.status)} 
                        size="small" 
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                      <Typography variant="body1">{selectedGrievance.department || 'Not Assigned'}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{selectedGrievance.description}</Typography>
                    </Box>
                  </Grid>

                  {selectedGrievance.resolution && (
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Resolution</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>{selectedGrievance.resolution}</Typography>
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Submitted On</Typography>
                      <Typography variant="body1">
                        {new Date(selectedGrievance.submissionDate).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>

                  {selectedGrievance.resolutionDate && (
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Resolved On</Typography>
                        <Typography variant="body1">
                          {new Date(selectedGrievance.resolutionDate).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setGrievanceViewDialogOpen(false)}>
                Close
              </Button>
              {selectedGrievance && selectedGrievance.status === 'OPEN' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleUpdateGrievanceStatus(selectedGrievance.id, 'RESOLVED', 'Marked as resolved by user')}
                >
                  Mark as Resolved
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </TabPanel>

        {/* AI Analysis Tab */}
        <TabPanel key="ai-analysis" value={currentTab} index={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'black' }}>
                🤖 AI-Powered Analysis
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={resetAIAnalysis}
                disabled={aiProcessing}
              >
                Reset Analysis
              </Button>
            </Box>

            {aiError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAiError(null)}>
                {aiError}
              </Alert>
            )}

            {aiSuccess && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setAiSuccess(null)}>
                {aiSuccess}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Analysis Mode Selection */}
              <Grid item xs={12}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MagicIcon color="primary" />
                      Choose Analysis Type
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant={aiAnalysisMode === 'document' ? 'contained' : 'outlined'}
                        startIcon={<DocumentIcon />}
                        onClick={() => {
                          setAiAnalysisMode('document');
                          resetAIAnalysis();
                        }}
                        disabled={aiProcessing}
                      >
                        Document Analysis
                      </Button>
                      <Button
                        variant={aiAnalysisMode === 'grievance' ? 'contained' : 'outlined'}
                        startIcon={<BrainIcon />}
                        onClick={() => {
                          setAiAnalysisMode('grievance');
                          resetAIAnalysis();
                        }}
                        disabled={aiProcessing}
                      >
                        Grievance Intelligence
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Input Section */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudUpload color="primary" />
                      {aiAnalysisMode === 'document' ? 'Upload Document' : 'Enter Text'}
                    </Typography>

                    {aiAnalysisMode === 'document' ? (
                      <Box>
                        <input
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          id="ai-file-upload"
                          type="file"
                          onChange={handleFileUpload}
                          disabled={aiProcessing}
                        />
                        <label htmlFor="ai-file-upload">
                          <Paper
                            sx={{
                              p: 3,
                              textAlign: 'center',
                              border: '2px dashed',
                              borderColor: aiAnalysisFile ? 'primary.main' : 'grey.300',
                              cursor: aiProcessing ? 'not-allowed' : 'pointer',
                              backgroundColor: aiAnalysisFile ? 'primary.50' : 'grey.50',
                              '&:hover': {
                                borderColor: aiProcessing ? 'grey.300' : 'primary.main',
                                backgroundColor: aiProcessing ? 'grey.50' : 'primary.100'
                              }
                            }}
                            component="div"
                          >
                            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                              {aiAnalysisFile ? aiAnalysisFile.name : 'Click to upload document'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Supports: JPG, PNG, PDF (Max 10MB)
                            </Typography>
                            {aiAnalysisFile && (
                              <Chip
                                label={`${(aiAnalysisFile.size / 1024 / 1024).toFixed(2)} MB`}
                                color="primary"
                                size="small"
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Paper>
                        </label>
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        placeholder="Enter your grievance text here for AI analysis..."
                        value={aiAnalysisText}
                        onChange={(e) => setAiAnalysisText(e.target.value)}
                        disabled={aiProcessing}
                        sx={{ mt: 2 }}
                      />
                    )}

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={aiProcessing ? <CircularProgress size={20} /> : <SmartToyIcon />}
                      onClick={aiAnalysisMode === 'document' ? handleAIDocumentAnalysis : handleAIGrievanceAnalysis}
                      disabled={aiProcessing || (aiAnalysisMode === 'document' ? !aiAnalysisFile : !aiAnalysisText.trim())}
                      sx={{
                        mt: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        }
                      }}
                    >
                      {aiProcessing ? 'Analyzing...' : `Analyze ${aiAnalysisMode === 'document' ? 'Document' : 'Text'}`}
                    </Button>

                    {aiProcessing && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={aiProgress} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                          {aiProgress < 30 ? 'Initializing AI models...' :
                           aiProgress < 60 ? 'Processing data...' :
                           aiProgress < 90 ? 'Analyzing content...' : 'Finalizing results...'}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Results Section */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon color="primary" />
                      Analysis Results
                    </Typography>

                    {!aiResults && !aiProcessing && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SmartToyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Ready for AI Analysis
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {aiAnalysisMode === 'document' 
                            ? 'Upload a document to see AI-powered insights'
                            : 'Enter text to get intelligent analysis'
                          }
                        </Typography>
                      </Box>
                    )}

                    {aiResults && aiAnalysisMode === 'document' && (
                      <Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Confidence</Typography>
                              <Typography variant="h4" color={getConfidenceColor(aiResults.confidence)}>
                                {(aiResults.confidence * 100).toFixed(1)}%
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Document Type</Typography>
                              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                {aiResults.documentType.replace('_', ' ')}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12}>
                            <Chip
                              label={aiResults.isValid ? "✅ Valid Document" : "❌ Invalid Document"}
                              color={aiResults.isValid ? 'success' : 'error'}
                              sx={{ mb: 2 }}
                            />
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                          Extracted Information:
                        </Typography>
                        {Object.entries(aiResults.extractedData).map(([key, value]) => (
                          <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {value}
                            </Typography>
                          </Box>
                        ))}

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                          AI Recommendations:
                        </Typography>
                        {aiResults.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1, pl: 2 }}>
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {aiResults && aiAnalysisMode === 'grievance' && (
                      <Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Sentiment</Typography>
                              <Chip
                                label={aiResults.sentiment.label}
                                color={getSentimentColor(aiResults.sentiment.label)}
                                sx={{ mt: 1 }}
                              />
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Urgency</Typography>
                              <Chip
                                label={aiResults.urgency.level}
                                color={getUrgencyColor(aiResults.urgency.level)}
                                sx={{ mt: 1 }}
                              />
                            </Paper>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                          AI Suggestions:
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Category:</Typography>
                          <Chip label={aiResults.suggestedCategory} size="small" color="primary" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Priority:</Typography>
                          <Chip label={aiResults.suggestedPriority} size="small" color="secondary" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Similar Cases:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {aiResults.similarCases} found
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Est. Resolution:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {aiResults.estimatedResolutionTime}
                          </Typography>
                        </Box>

                        {aiResults.keywords.length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                              Key Topics:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {aiResults.keywords.map((keyword, index) => (
                                <Chip key={index} label={keyword} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Analysis History */}
              {aiAnalysisHistory.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimelineIcon color="primary" />
                        Analysis History
                      </Typography>
                      <Grid container spacing={2}>
                        {aiAnalysisHistory.slice(0, 6).map((analysis, index) => (
                          <Grid item xs={12} sm={6} md={4} key={analysis.id}>
                            <Card 
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 4 }
                              }}
                              onClick={() => {
                                setSelectedAnalysis(analysis);
                                setAnalysisDetailOpen(true);
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  {analysis.fileName || 'Text Analysis'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(analysis.analysisDate).toLocaleString()}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                  <Chip 
                                    label={analysis.fileName ? 'Document' : 'Grievance'} 
                                    size="small" 
                                    color="primary" 
                                  />
                                  {analysis.confidence && (
                                    <Typography variant="caption">
                                      {(analysis.confidence * 100).toFixed(0)}%
                                    </Typography>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </motion.div>

          {/* Analysis Detail Dialog */}
          <Dialog open={analysisDetailOpen} onClose={() => setAnalysisDetailOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                📊 Detailed Analysis Results
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {selectedAnalysis && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      {selectedAnalysis.fileName || 'Text Analysis'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyzed on {new Date(selectedAnalysis.analysisDate).toLocaleString()}
                    </Typography>
                  </Grid>
                  
                  {selectedAnalysis.fileName && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Document Type</Typography>
                          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                            {selectedAnalysis.documentType?.replace('_', ' ')}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Confidence Score</Typography>
                          <Typography variant="h6" color={getConfidenceColor(selectedAnalysis.confidence)}>
                            {(selectedAnalysis.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </>
                  )}

                  {selectedAnalysis.sentiment && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Sentiment</Typography>
                          <Chip
                            label={selectedAnalysis.sentiment.label}
                            color={getSentimentColor(selectedAnalysis.sentiment.label)}
                          />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">Urgency Level</Typography>
                          <Chip
                            label={selectedAnalysis.urgency.level}
                            color={getUrgencyColor(selectedAnalysis.urgency.level)}
                          />
                        </Paper>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Processing Details
                      </Typography>
                      <Typography variant="body2">
                        • Processing Time: {selectedAnalysis.processingTime}
                      </Typography>
                      <Typography variant="body2">
                        • AI Model: {selectedAnalysis.aiModel || 'BharatChain-AI-v2.1'}
                      </Typography>
                      <Typography variant="body2">
                        • Analysis ID: {selectedAnalysis.id}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setAnalysisDetailOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
      </AnimatePresence>
    </Container>
  );
};

export default CitizenDashboard;
