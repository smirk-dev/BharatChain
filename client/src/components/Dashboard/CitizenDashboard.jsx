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
import '../../../styles/BharatTheme.css';
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

  // Helper function for tab emojis
  const getTabEmoji = (index) => {
    const emojis = ['🏠', '👤', '📄', '📋', '🤖'];
    return emojis[index] || '📊';
  };

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
      const downloadUrl = `${API_BASE_URL}/api/documents/${document.id}/download?address=${account}`;
      
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
      
      const response = await fetch(`${API_BASE_URL}/api/grievances?address=${account}`, {
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

      const response = await fetch(`${API_BASE_URL}/api/grievances`, {
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
      const response = await fetch(`${API_BASE_URL}/api/grievances/${grievanceId}?address=${account}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/grievances/${grievanceId}/status`, {
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
    // Use real AI analysis instead of mock data
    const analysisSteps = [
      { step: 'Analyzing text...', progress: 25 },
      { step: 'Processing with AI...', progress: 50 },
      { step: 'Generating insights...', progress: 75 },
      { step: 'Finalizing results...', progress: 100 }
    ];

    for (const stepData of analysisSteps) {
      setAiProgress(stepData.progress);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      // Call the real enhanced AI service
      const response = await fetch(`${API_BASE_URL}/ai/analyze/grievance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        throw new Error('AI service error');
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        return {
          id: Date.now(),
          text: text,
          analysisDate: new Date().toISOString(),
          confidence: data.analysis.metadata?.confidence_score || 0.8,
          isValid: true,
          analysis: data.analysis, // Store the full enhanced AI analysis
          sentiment: {
            score: data.analysis.sentiment?.score || 0,
            label: data.analysis.sentiment?.overall || 'Neutral',
            confidence: data.analysis.sentiment?.confidence || 0.8
          },
          urgency: {
            score: data.analysis.urgency?.score || 0.5,
            level: data.analysis.urgency?.level || 'Medium'
          },
          processingTime: `${data.analysis.metadata?.processing_time_ms || 200}ms`
        };
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      // Fallback to basic analysis if AI service fails
      return {
        id: Date.now(),
        text: text,
        analysisDate: new Date().toISOString(),
        confidence: 0.6,
        isValid: false,
        sentiment: {
          score: 0,
          label: 'Analysis Failed',
          confidence: 0.3
        },
        urgency: {
          score: 0.5,
          level: 'Medium'
        },
        processingTime: 'Service unavailable'
      };
    }
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
    <div className="bharat-container">
      {/* Indian Heritage Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <div className="bharat-chakra"></div>
          <Typography variant="h3" className="bharat-title" gutterBottom>
            🇮🇳 भारत चेन डैशबोर्ड 🇮🇳
          </Typography>
          <Typography variant="h4" className="bharat-title" gutterBottom sx={{ color: '#FF9933', mt: 1 }}>
            BharatChain Digital Identity Platform
          </Typography>
          <Typography variant="subtitle1" className="bharat-subtitle">
            🪔 डिजिटल भारत की शक्ति से जुड़ें • Connected as: {formatAddress(account)} 🪔
          </Typography>
          <div className="bharat-decorative-border"></div>
          <Chip 
            label="🛡️ सत्यापित नागरिक • Verified Citizen" 
            size="medium" 
            icon={<Verified />}
            className="bharat-status-verified"
            sx={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
              color: 'white',
              '& .MuiChip-icon': { color: 'white' }
            }} 
          />
        </Box>
      </motion.div>

      {/* Loading Progress with Indian Theme */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <div className="bharat-progress">
            <div className="bharat-progress-fill" style={{ width: '100%' }}></div>
          </div>
        </Box>
      )}

      {/* Indian-styled Tabs */}
      <Card className="bharat-card" sx={{ mb: 3 }}>
        <div className="bharat-tabs">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: '25px',
                margin: '0 8px',
                color: '#7B3F00',
                '&:hover': {
                  backgroundColor: 'rgba(255, 153, 51, 0.1)',
                  color: '#FF9933'
                }
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
                color: 'white !important',
                boxShadow: '0 4px 16px rgba(255, 153, 51, 0.3)',
                fontWeight: 700
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={`${getTabEmoji(index)} ${tab.label}`}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </div>
      </Card>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        <TabPanel key="dashboard" value={currentTab} index={0}>
          <div className="bharat-rangoli"></div>
          <Grid container spacing={4}>
            {/* Sanskrit Welcome Message */}
            <Grid item xs={12}>
              <Typography className="bharat-sanskrit">
                सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः • May All Be Happy and Healthy
              </Typography>
            </Grid>

            {/* Statistics Cards with Indian Theme */}
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 700, 
                mb: 4, 
                color: '#000080',
                textAlign: 'center',
                fontSize: '2.5rem',
                fontFamily: '"Playfair Display", serif'
              }}>
                📊 आंकड़ों की झलक • Dashboard Statistics
              </Typography>
            </Grid>

            {[
              {
                title: 'कुल दस्तावेज़',
                subtitle: 'Total Documents',
                value: stats.totalDocuments,
                icon: '📜',
                gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
                trend: '+12%',
                description: 'सभी अपलोड किए गए दस्तावेज़'
              },
              {
                title: 'सत्यापित दस्तावेज़',
                subtitle: 'Verified Documents', 
                value: stats.verifiedDocuments,
                icon: '✅',
                gradient: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
                trend: '+8%',
                description: 'प्रमाणित और स्वीकृत'
              },
              {
                title: 'लंबित शिकायतें',
                subtitle: 'Pending Grievances',
                value: stats.pendingGrievances,
                icon: '⏳',
                gradient: 'linear-gradient(135deg, #E49B0F 0%, #FFA500 100%)', 
                trend: '-5%',
                description: 'समाधान की प्रतीक्षा में'
              },
              {
                title: 'हल की गई समस्याएं',
                subtitle: 'Resolved Issues',
                value: stats.resolvedGrievances,
                icon: '🎯',
                gradient: 'linear-gradient(135deg, #005A5B 0%, #4169E1 100%)',
                trend: '+25%',
                description: 'सफलतापूर्वक हल किया गया'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  style={{ height: '100%' }}
                >
                  <Card 
                    className="bharat-card bharat-glow"
                    sx={{ 
                      p: 3, 
                      height: '100%',
                      background: stat.gradient,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: -20, right: -20, fontSize: '6rem', opacity: 0.1 }}>
                      {stat.icon}
                    </Box>
                    <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: '3rem', mr: 2 }}>
                          {stat.icon}
                        </Typography>
                        <Chip 
                          label={stat.trend} 
                          size="small" 
                          sx={{ 
                            ml: 'auto',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 700,
                            border: '1px solid rgba(255,255,255,0.3)'
                          }} 
                        />
                      </Box>
                      <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.95, fontFamily: '"Playfair Display", serif' }}>
                        {stat.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                        {stat.subtitle}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block', fontStyle: 'italic' }}>
                        {stat.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* Quick Actions with Traditional Indian Style */}
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontWeight: 700, 
                mb: 4, 
                mt: 4,
                color: '#000080',
                textAlign: 'center',
                fontSize: '2.5rem',
                fontFamily: '"Playfair Display", serif'
              }}>
                🚀 त्वरित कार्य • Quick Actions
              </Typography>
            </Grid>

            {[
              {
                title: 'दस्तावेज़ अपलोड',
                subtitle: 'Upload Document',
                description: 'नए दस्तावेज़ सत्यापन के लिए जोड़ें',
                englishDesc: 'Add new documents for verification',
                icon: '📤',
                action: () => setCurrentTab(2),
                gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                bgPattern: '🏛️'
              },
              {
                title: 'शिकायत दर्ज करें',
                subtitle: 'Submit Grievance', 
                description: 'समस्याओं या शिकायतों की रिपोर्ट करें',
                englishDesc: 'Report issues or complaints',
                icon: '📝',
                action: () => setCurrentTab(3),
                gradient: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
                bgPattern: '⚖️'
              },
              {
                title: 'AI दस्तावेज़ विश्लेषण',
                subtitle: 'AI Document Analysis',
                description: 'उन्नत दस्तावेज़ प्रसंस्करण',
                englishDesc: 'Advanced document processing',
                icon: '🤖',
                action: () => setCurrentTab(4),
                gradient: 'linear-gradient(135deg, #005A5B 0%, #4169E1 100%)',
                bgPattern: '🔬'
              },
              {
                title: 'प्रोफ़ाइल अपडेट',
                subtitle: 'Update Profile',
                description: 'अपनी जानकारी प्रबंधित करें',
                englishDesc: 'Manage your information', 
                icon: '👤',
                action: () => setCurrentTab(1),
                gradient: 'linear-gradient(135deg, #E49B0F 0%, #FFA500 100%)',
                bgPattern: '🎭'
              }
            ].map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.08, rotateY: 8 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ height: '100%' }}
                >
                  <Card 
                    className="bharat-action-card bharat-glow"
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid transparent',
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: '280px',
                      backdropFilter: 'blur(20px)',
                      '&:hover': {
                        borderColor: '#FF9933',
                        boxShadow: '0 20px 60px rgba(255, 153, 51, 0.3)',
                        '& .action-button': {
                          background: action.gradient,
                          transform: 'translateY(-2px)'
                        }
                      }
                    }}
                    onClick={action.action}
                  >
                    <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: 0.08, color: '#FF9933' }}>
                      {action.bgPattern}
                    </Box>
                    <CardContent sx={{ textAlign: 'center', p: 4, position: 'relative', zIndex: 2 }}>
                      <Box sx={{ 
                        fontSize: '4rem', 
                        mb: 3,
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                      }}>
                        {action.icon}
                      </Box>
                      <Typography variant="h5" gutterBottom sx={{ 
                        fontWeight: 700,
                        color: '#000080',
                        fontFamily: '"Playfair Display", serif',
                        mb: 1
                      }}>
                        {action.title}
                      </Typography>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontWeight: 600,
                        color: '#7B3F00',
                        mb: 2
                      }}>
                        {action.subtitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 1,
                        fontWeight: 500,
                        color: '#7B3F00'
                      }}>
                        {action.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 3,
                        fontStyle: 'italic',
                        opacity: 0.8
                      }}>
                        {action.englishDesc}
                      </Typography>
                      <Button
                        className="action-button"
                        variant="contained"
                        size="large"
                        sx={{ 
                          mt: 2,
                          borderRadius: '25px',
                          px: 4,
                          py: 1.5,
                          fontWeight: 700,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 16px rgba(255, 153, 51, 0.3)'
                        }}
                        startIcon={<span style={{ fontSize: '1.2rem' }}>🚀</span>}
                      >
                        शुरू करें • Start
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}

            {/* System Status with Traditional Indian Styling */}
            <Grid item xs={12}>
              <Card className="bharat-card" sx={{ mt: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      flexGrow: 1, 
                      color: '#000080',
                      fontFamily: '"Playfair Display", serif'
                    }}>
                      🔧 सिस्टम स्थिति • System Status
                    </Typography>
                    <Tooltip title="स्थिति रीफ्रेश करें • Refresh Status">
                      <IconButton 
                        size="large" 
                        sx={{ 
                          color: '#FF9933',
                          background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #FF9933 0%, #FFD700 100%)',
                            color: 'white'
                          }
                        }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Grid container spacing={3}>
                    {[
                      { 
                        name: 'ब्लॉकचेन नेटवर्क', 
                        englishName: 'Blockchain Network', 
                        status: 'Connected',
                        statusHindi: 'जुड़ा हुआ',
                        icon: '🔗',
                        gradient: 'linear-gradient(135deg, #138808 0%, #50C878 100%)'
                      },
                      { 
                        name: 'IPFS भंडारण', 
                        englishName: 'IPFS Storage', 
                        status: 'Online',
                        statusHindi: 'ऑनलाइन',
                        icon: '☁️',
                        gradient: 'linear-gradient(135deg, #005A5B 0%, #4169E1 100%)'
                      },
                      { 
                        name: 'AI प्रसंस्करण', 
                        englishName: 'AI Processing', 
                        status: 'Available',
                        statusHindi: 'उपलब्ध',
                        icon: '🤖',
                        gradient: 'linear-gradient(135deg, #E49B0F 0%, #FFA500 100%)'
                      },
                      { 
                        name: 'दस्तावेज़ सत्यापन', 
                        englishName: 'Document Verification', 
                        status: 'Active',
                        statusHindi: 'सक्रिय',
                        icon: '✅',
                        gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                      }
                    ].map((service, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            p: 3, 
                            background: service.gradient,
                            borderRadius: 4,
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '150px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
                          }}>
                            <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '4rem', opacity: 0.1 }}>
                              {service.icon}
                            </Box>
                            <Typography sx={{ fontSize: '3rem', mb: 2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                              {service.icon}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontFamily: '"Playfair Display", serif' }}>
                              {service.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, opacity: 0.9, fontWeight: 500 }}>
                              {service.englishName}
                            </Typography>
                            <Chip
                              label={`${service.statusHindi} • ${service.status}`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontWeight: 600,
                                border: '1px solid rgba(255, 255, 255, 0.3)'
                              }}
                            />
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {/* Footer with Inspirational Message */}
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography className="bharat-sanskrit" sx={{ fontSize: '1rem', color: '#7B3F00' }}>
                      वसुधैव कुटुम्बकम् • The World is One Family
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                      "Powered by BharatChain - Connecting India's Digital Future with Blockchain Technology"
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Profile Tab with Indian Heritage Theme */}
        <TabPanel key="profile" value={currentTab} index={1}>
          <Grid container spacing={4}>
            {/* Profile Header with Indian Design */}
            <Grid item xs={12}>
              <Card className="bharat-card">
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      flexGrow: 1,
                      color: '#000080',
                      fontFamily: '"Playfair Display", serif'
                    }}>
                      👤 नागरिक प्रोफ़ाइल • Citizen Profile
                    </Typography>
                    {!isEditingProfile ? (
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleProfileEdit}
                        className="bharat-button"
                        sx={{ 
                          ml: 2,
                          background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                          px: 3,
                          py: 1.5,
                          borderRadius: '25px',
                          fontWeight: 700
                        }}
                      >
                        संपादित करें • Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<SaveIcon />}
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                          sx={{
                            background: 'linear-gradient(135deg, #138808 0%, #50C878 100%)',
                            px: 3,
                            py: 1.5,
                            borderRadius: '25px',
                            fontWeight: 700
                          }}
                        >
                          सेव करें • Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleProfileCancel}
                          disabled={profileLoading}
                          sx={{
                            borderColor: '#FF9933',
                            color: '#FF9933',
                            px: 3,
                            py: 1.5,
                            borderRadius: '25px',
                            fontWeight: 700,
                            '&:hover': {
                              borderColor: '#FF6B35',
                              backgroundColor: 'rgba(255, 153, 51, 0.1)'
                            }
                          }}
                        >
                          रद्द करें • Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {profileLoading && (
                    <Box sx={{ mb: 3 }}>
                      <div className="bharat-progress">
                        <div className="bharat-progress-fill" style={{ width: '100%' }}></div>
                      </div>
                    </Box>
                  )}

                  {profileError && (
                    <Alert severity="error" className="bharat-alert bharat-alert-error" sx={{ mb: 3 }} onClose={() => setProfileError(null)}>
                      <strong>त्रुटि • Error:</strong> {profileError}
                    </Alert>
                  )}

                  {profileSuccess && (
                    <Alert severity="success" className="bharat-alert bharat-alert-success" sx={{ mb: 3 }} onClose={() => setProfileSuccess(null)}>
                      <strong>सफलता • Success:</strong> {profileSuccess}
                    </Alert>
                  )}

                  {/* Profile Picture Section with Indian Theme */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box className="bharat-avatar" sx={{ mr: { xs: 0, sm: 4 }, mb: { xs: 3, sm: 0 } }}>
                      {profile.profileImage ? (
                        <img 
                          src={profile.profileImage} 
                          alt="Profile" 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: '50%' 
                          }} 
                        />
                      ) : (
                        <Typography sx={{ fontSize: '3rem', fontWeight: 700 }}>
                          {profile.name ? profile.name.charAt(0).toUpperCase() : account ? account.charAt(2).toUpperCase() : '🙏'}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 700,
                        color: '#000080',
                        fontFamily: '"Playfair Display", serif',
                        mb: 1
                      }}>
                        {profile.name || 'नया उपयोगकर्ता • New User'}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        वॉलेट • Wallet: {formatAddress(account)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <Chip
                          label={profile.isVerified ? "✅ सत्यापित नागरिक • Verified Citizen" : profile.name ? "⏳ सत्यापन लंबित • Pending Verification" : "❗ प्रोफ़ाइल अधूरी • Profile Incomplete"}
                          color={profile.isVerified ? "success" : profile.name ? "warning" : "error"}
                          size="medium"
                          icon={<Verified />}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            px: 2
                          }}
                        />
                        {isEditingProfile && (
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<PhotoCamera />}
                            sx={{
                              borderColor: '#FF9933',
                              color: '#FF9933',
                              borderRadius: '20px',
                              fontWeight: 600,
                              '&:hover': {
                                borderColor: '#FF6B35',
                                backgroundColor: 'rgba(255, 153, 51, 0.1)'
                              }
                            }}
                          >
                            फोटो अपलोड • Upload Photo
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

                  {/* New User Welcome Message with Indian Styling */}
                  {!profile.name && !isEditingProfile && (
                    <Alert severity="info" className="bharat-alert bharat-alert-info" sx={{ mb: 4 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>
                          🙏 भारत चेन में आपका स्वागत है! • Welcome to BharatChain!
                        </Typography>
                        <Typography>
                          कृपया अपना नागरिक पंजीकरण पूरा करने और सभी प्लेटफॉर्म सुविधाओं को अनलॉक करने के लिए "प्रोफ़ाइल संपादित करें" पर क्लिक करें।
                        </Typography>
                        <Typography sx={{ fontStyle: 'italic', mt: 1, opacity: 0.8 }}>
                          Please click "Edit Profile" to complete your citizen registration and unlock all platform features.
                        </Typography>
                      </Box>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Personal Information with Indian Heritage Design */}
            <Grid item xs={12} md={6}>
              <Card className="bharat-card">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    mb: 4, 
                    display: 'flex', 
                    alignItems: 'center',
                    color: '#000080',
                    fontFamily: '"Playfair Display", serif'
                  }}>
                    <PersonIcon sx={{ mr: 2, color: '#FF9933' }} />
                    व्यक्तिगत जानकारी • Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="पूरा नाम • Full Name *"
                        value={profile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        required
                        error={isEditingProfile && !profile.name}
                        helperText={isEditingProfile && !profile.name ? "नाम आवश्यक है • Name is required" : ""}
                        className="bharat-input"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 153, 51, 0.3)',
                              borderWidth: '2px'
                            },
                            '&:hover fieldset': {
                              borderColor: '#FF9933'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#FF6B35'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: '#7B3F00',
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="जन्म तिथि • Date of Birth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 153, 51, 0.3)',
                              borderWidth: '2px'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: '#7B3F00',
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!isEditingProfile}>
                        <InputLabel sx={{ color: '#7B3F00', fontWeight: 600 }}>लिंग • Gender</InputLabel>
                        <Select
                          value={profile.gender}
                          label="लिंग • Gender"
                          onChange={(e) => handleProfileChange('gender', e.target.value)}
                          variant={isEditingProfile ? "outlined" : "filled"}
                          sx={{
                            borderRadius: '12px',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 153, 51, 0.3)',
                              borderWidth: '2px'
                            }
                          }}
                        >
                          <MenuItem value="Male">पुरुष • Male</MenuItem>
                          <MenuItem value="Female">महिला • Female</MenuItem>
                          <MenuItem value="Other">अन्य • Other</MenuItem>
                          <MenuItem value="Prefer not to say">कहना नहीं चाहते • Prefer not to say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="शिक्षा • Education"
                        value={profile.education}
                        onChange={(e) => handleProfileChange('education', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <School sx={{ mr: 1, color: '#FF9933' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 153, 51, 0.3)',
                              borderWidth: '2px'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: '#7B3F00',
                            fontWeight: 600
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="व्यवसाय • Occupation"
                        value={profile.occupation}
                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                        disabled={!isEditingProfile}
                        variant={isEditingProfile ? "outlined" : "filled"}
                        InputProps={{
                          startAdornment: <Work sx={{ mr: 1, color: '#FF9933' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': {
                              borderColor: 'rgba(255, 153, 51, 0.3)',
                              borderWidth: '2px'
                            }
                          },
                          '& .MuiInputLabel-root': {
                            color: '#7B3F00',
                            fontWeight: 600
                          }
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
                          <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Document Analysis Confidence
                              </Typography>
                              <Typography variant="h3" color={getConfidenceColor(aiResults.confidence)} sx={{ mb: 2 }}>
                                {(aiResults.confidence * 100).toFixed(1)}%
                              </Typography>
                              <Chip
                                label={aiResults.isValid ? "✅ Document Verified" : "❌ Verification Failed"}
                                color={aiResults.isValid ? 'success' : 'error'}
                                size="large"
                                sx={{ fontSize: '1rem', px: 2, py: 1 }}
                              />
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {aiResults && aiAnalysisMode === 'grievance' && (
                      <Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Analysis Confidence</Typography>
                              <Typography variant="h4" color={getConfidenceColor(aiResults.confidence || 0.8)}>
                                {((aiResults.confidence || 0.8) * 100).toFixed(1)}%
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="body2" color="text.secondary">Verification Status</Typography>
                              <Chip
                                label={aiResults.isValid !== false ? "✅ Verified" : "❌ Needs Review"}
                                color={aiResults.isValid !== false ? 'success' : 'warning'}
                                sx={{ mt: 1 }}
                              />
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Enhanced AI Results Display */}
                        {aiResults.analysis && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                              AI Analysis Summary:
                            </Typography>
                            
                            {/* Main Issue */}
                            {aiResults.analysis.summary?.main_issue && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Primary Issue:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                  {aiResults.analysis.summary.main_issue}
                                </Typography>
                              </Box>
                            )}

                            {/* Key Metrics Grid */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                              {aiResults.analysis.emotion?.primary && (
                                <Grid item xs={6}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Emotion</Typography>
                                    <Chip
                                      label={aiResults.analysis.emotion.primary}
                                      color={getSentimentColor(aiResults.analysis.emotion.primary)}
                                      size="small"
                                    />
                                  </Box>
                                </Grid>
                              )}
                              
                              {aiResults.analysis.urgency?.level && (
                                <Grid item xs={6}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">Urgency</Typography>
                                    <Chip
                                      label={aiResults.analysis.urgency.level}
                                      color={getUrgencyColor(aiResults.analysis.urgency.level)}
                                      size="small"
                                    />
                                  </Box>
                                </Grid>
                              )}
                            </Grid>

                            {/* Department Assignment */}
                            {aiResults.analysis.category?.department && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Assigned Department:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {aiResults.analysis.category.department}
                                </Typography>
                              </Box>
                            )}

                            {/* Response Time */}
                            {aiResults.analysis.urgency?.response_time && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">Expected Response Time:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {aiResults.analysis.urgency.response_time}
                                </Typography>
                              </Box>
                            )}
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
    </div>
  );
};

export default CitizenDashboard;
