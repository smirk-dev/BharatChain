import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWeb3 } from './Web3Context';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Dashboard Context
const DashboardContext = createContext();

// Action Types
const DashboardActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_STATS: 'SET_STATS',
  SET_PROFILE: 'SET_PROFILE',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  SET_GRIEVANCES: 'SET_GRIEVANCES',
  SET_AI_ANALYSIS: 'SET_AI_ANALYSIS',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_SUCCESS: 'CLEAR_SUCCESS',
  UPDATE_PROFILE_FIELD: 'UPDATE_PROFILE_FIELD',
  SET_EDITING_PROFILE: 'SET_EDITING_PROFILE',
  ADD_DOCUMENT: 'ADD_DOCUMENT',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  DELETE_DOCUMENT: 'DELETE_DOCUMENT',
  ADD_GRIEVANCE: 'ADD_GRIEVANCE',
  UPDATE_GRIEVANCE: 'UPDATE_GRIEVANCE',
  DELETE_GRIEVANCE: 'DELETE_GRIEVANCE',
  SET_GOVERNMENT_SERVICES: 'SET_GOVERNMENT_SERVICES',
  SET_QR_CODES: 'SET_QR_CODES',
  SET_PAYMENT_HISTORY: 'SET_PAYMENT_HISTORY',
  SET_EMERGENCY_DATA: 'SET_EMERGENCY_DATA',
  SET_OPEN_DATA: 'SET_OPEN_DATA',
  SET_COMPLIANCE_DATA: 'SET_COMPLIANCE_DATA'
};

// Initial State
const initialState = {
  // Loading States
  isLoading: false,
  profileLoading: false,
  documentsLoading: false,
  grievancesLoading: false,
  
  // Data States
  stats: {
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingGrievances: 0,
    resolvedGrievances: 0,
    governmentServices: 12,
    mobileFeatures: 4,
    completedPayments: 0,
    emergencyContacts: 3
  },
  
  // Profile Data
  profile: {
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
  },
  originalProfile: {},
  isEditingProfile: false,
  
  // Documents Data
  documents: [],
  
  // Grievances Data
  grievances: [],
  
  // AI Analysis Data
  aiAnalysisHistory: [],
  aiResults: null,
  aiProcessing: false,
  aiProgress: 0,
  
  // Government Services Data
  govServices: [],
  identityVerifications: [],
  govServiceApplications: [],
  
  // QR & Mobile Data
  qrCodes: [],
  generatedQR: null,
  mobileConfig: {},
  offlineSync: { status: 'online', pendingOperations: 0 },
  mobileAuth: { otpSent: false, verified: false },
  
  // Payment Data
  paymentHistory: [],
  pendingPayments: [],
  paymentMethods: [],
  serviceFees: {},
  
  // Emergency Data
  emergencyContacts: [],
  sosAlerts: [],
  disasterAlerts: [],
  emergencyServices: [],
  
  // Open Data
  rtiApplications: [],
  governmentDatasets: [],
  budgetData: [],
  tenderData: [],
  
  // Compliance Data
  complianceStatus: {},
  auditLogs: [],
  riskAssessments: [],
  incidents: [],
  
  // Error and Success States
  errors: {
    profile: null,
    documents: null,
    grievances: null,
    ai: null,
    general: null
  },
  success: {
    profile: null,
    documents: null,
    grievances: null,
    ai: null,
    general: null
  }
};

// Dashboard Reducer
const dashboardReducer = (state, action) => {
  switch (action.type) {
    case DashboardActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        [`${action.payload.type}Loading`]: action.payload.isLoading
      };
      
    case DashboardActionTypes.SET_STATS:
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      };
      
    case DashboardActionTypes.SET_PROFILE:
      return {
        ...state,
        profile: action.payload.profile,
        originalProfile: action.payload.original || action.payload.profile,
        isEditingProfile: action.payload.isEditing || false
      };
      
    case DashboardActionTypes.UPDATE_PROFILE_FIELD:
      return {
        ...state,
        profile: {
          ...state.profile,
          [action.payload.field]: action.payload.value
        }
      };
      
    case DashboardActionTypes.SET_EDITING_PROFILE:
      return {
        ...state,
        isEditingProfile: action.payload,
        profile: action.payload ? state.profile : state.originalProfile
      };
      
    case DashboardActionTypes.SET_DOCUMENTS:
      return {
        ...state,
        documents: action.payload
      };
      
    case DashboardActionTypes.ADD_DOCUMENT:
      return {
        ...state,
        documents: [...state.documents, action.payload],
        stats: {
          ...state.stats,
          totalDocuments: state.stats.totalDocuments + 1
        }
      };
      
    case DashboardActionTypes.UPDATE_DOCUMENT:
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id ? { ...doc, ...action.payload.updates } : doc
        )
      };
      
    case DashboardActionTypes.DELETE_DOCUMENT:
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        stats: {
          ...state.stats,
          totalDocuments: Math.max(0, state.stats.totalDocuments - 1)
        }
      };
      
    case DashboardActionTypes.SET_GRIEVANCES:
      return {
        ...state,
        grievances: action.payload
      };
      
    case DashboardActionTypes.ADD_GRIEVANCE:
      return {
        ...state,
        grievances: [...state.grievances, action.payload],
        stats: {
          ...state.stats,
          pendingGrievances: state.stats.pendingGrievances + 1
        }
      };
      
    case DashboardActionTypes.UPDATE_GRIEVANCE:
      return {
        ...state,
        grievances: state.grievances.map(grievance => 
          grievance.id === action.payload.id ? { ...grievance, ...action.payload.updates } : grievance
        )
      };
      
    case DashboardActionTypes.DELETE_GRIEVANCE:
      return {
        ...state,
        grievances: state.grievances.filter(grievance => grievance.id !== action.payload)
      };
      
    case DashboardActionTypes.SET_AI_ANALYSIS:
      return {
        ...state,
        aiResults: action.payload.results,
        aiAnalysisHistory: action.payload.results ? 
          [action.payload.results, ...state.aiAnalysisHistory] : state.aiAnalysisHistory,
        aiProcessing: action.payload.processing || false,
        aiProgress: action.payload.progress || 0
      };
      
    case DashboardActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: action.payload.message
        }
      };
      
    case DashboardActionTypes.SET_SUCCESS:
      return {
        ...state,
        success: {
          ...state.success,
          [action.payload.type]: action.payload.message
        }
      };
      
    case DashboardActionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload]: null
        }
      };
      
    case DashboardActionTypes.CLEAR_SUCCESS:
      return {
        ...state,
        success: {
          ...state.success,
          [action.payload]: null
        }
      };
      
    case DashboardActionTypes.SET_GOVERNMENT_SERVICES:
      return {
        ...state,
        govServices: action.payload.services || [],
        identityVerifications: action.payload.verifications || [],
        govServiceApplications: action.payload.applications || []
      };
      
    case DashboardActionTypes.SET_QR_CODES:
      return {
        ...state,
        qrCodes: action.payload.codes || [],
        generatedQR: action.payload.generated || null,
        mobileConfig: action.payload.config || {},
        offlineSync: action.payload.sync || state.offlineSync,
        mobileAuth: action.payload.auth || state.mobileAuth
      };
      
    case DashboardActionTypes.SET_PAYMENT_HISTORY:
      return {
        ...state,
        paymentHistory: action.payload.history || [],
        pendingPayments: action.payload.pending || [],
        paymentMethods: action.payload.methods || [],
        serviceFees: action.payload.fees || {}
      };
      
    case DashboardActionTypes.SET_EMERGENCY_DATA:
      return {
        ...state,
        emergencyContacts: action.payload.contacts || [],
        sosAlerts: action.payload.alerts || [],
        disasterAlerts: action.payload.disasters || [],
        emergencyServices: action.payload.services || []
      };
      
    case DashboardActionTypes.SET_OPEN_DATA:
      return {
        ...state,
        rtiApplications: action.payload.rti || [],
        governmentDatasets: action.payload.datasets || [],
        budgetData: action.payload.budget || [],
        tenderData: action.payload.tenders || []
      };
      
    case DashboardActionTypes.SET_COMPLIANCE_DATA:
      return {
        ...state,
        complianceStatus: action.payload.status || {},
        auditLogs: action.payload.logs || [],
        riskAssessments: action.payload.risks || [],
        incidents: action.payload.incidents || []
      };
      
    default:
      return state;
  }
};

// Dashboard Provider Component
export const DashboardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { account, isConnected } = useWeb3();
  
  // Utility Functions
  const setLoading = (type, isLoading) => {
    dispatch({
      type: DashboardActionTypes.SET_LOADING,
      payload: { type, isLoading }
    });
  };
  
  const setError = (type, message) => {
    dispatch({
      type: DashboardActionTypes.SET_ERROR,
      payload: { type, message }
    });
  };
  
  const setSuccess = (type, message) => {
    dispatch({
      type: DashboardActionTypes.SET_SUCCESS,
      payload: { type, message }
    });
    // Auto-clear success messages after 3 seconds
    setTimeout(() => clearSuccess(type), 3000);
  };
  
  const clearError = (type) => {
    dispatch({
      type: DashboardActionTypes.CLEAR_ERROR,
      payload: type
    });
  };
  
  const clearSuccess = (type) => {
    dispatch({
      type: DashboardActionTypes.CLEAR_SUCCESS,
      payload: type
    });
  };
  
  // Profile Functions
  const loadProfile = async () => {
    if (!account) return;
    
    try {
      setLoading('profile', true);
      clearError('profile');
      
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
          
          dispatch({
            type: DashboardActionTypes.SET_PROFILE,
            payload: { profile: profileData, original: profileData }
          });
        }
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('profile', 'Failed to load profile. Please try again.');
    } finally {
      setLoading('profile', false);
    }
  };
  
  const saveProfile = async () => {
    if (!account) return false;
    
    try {
      setLoading('profile', true);
      clearError('profile');
      
      // Validate required fields
      if (!state.profile.name || !state.profile.email || !state.profile.phone) {
        setError('profile', 'Please fill in all required fields (Name, Email, Phone)');
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(state.profile.email)) {
        setError('profile', 'Please enter a valid email address');
        return false;
      }

      // Phone validation
      let formattedPhone = state.profile.phone.replace(/[\s\-()]/g, '');
      if (formattedPhone.startsWith('+91')) {
        formattedPhone = formattedPhone.substring(3);
      } else if (formattedPhone.startsWith('91')) {
        formattedPhone = formattedPhone.substring(2);
      }
      
      if (!/^[6-9]\d{9}$/.test(formattedPhone)) {
        setError('profile', 'Please enter a valid Indian mobile number (10 digits starting with 6-9)');
        return false;
      }

      const aadharHash = state.profile.aadharNumber ? 
        `hash_${state.profile.aadharNumber.replace(/\s/g, '')}` : 
        `hash_${Date.now()}`;

      const requestBody = {
        walletAddress: account,
        name: state.profile.name.trim(),
        email: state.profile.email.trim(),
        phone: `+91${formattedPhone}`,
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
        dispatch({
          type: DashboardActionTypes.SET_PROFILE,
          payload: { 
            profile: state.profile, 
            original: state.profile, 
            isEditing: false 
          }
        });
        setSuccess('profile', 'Profile saved successfully!');
        return true;
      } else {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(error => error.msg).join(', ');
          setError('profile', `Validation Error: ${errorMessages}`);
        } else {
          setError('profile', data.message || 'Failed to save profile');
        }
        return false;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('profile', error.message || 'Failed to save profile. Please try again.');
      return false;
    } finally {
      setLoading('profile', false);
    }
  };
  
  const updateProfileField = (field, value) => {
    dispatch({
      type: DashboardActionTypes.UPDATE_PROFILE_FIELD,
      payload: { field, value }
    });
  };
  
  const setEditingProfile = (isEditing) => {
    dispatch({
      type: DashboardActionTypes.SET_EDITING_PROFILE,
      payload: isEditing
    });
    if (!isEditing) {
      clearError('profile');
      clearSuccess('profile');
    }
  };
  
  // Documents Functions
  const loadDocuments = async () => {
    if (!account) return;
    
    try {
      setLoading('documents', true);
      clearError('documents');
      
      const response = await fetch(`${API_BASE_URL}/api/documents?address=${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({
            type: DashboardActionTypes.SET_DOCUMENTS,
            payload: data.data.documents || []
          });
          
          // Update stats
          const verifiedCount = (data.data.documents || []).filter(doc => doc.status === 'verified').length;
          dispatch({
            type: DashboardActionTypes.SET_STATS,
            payload: {
              totalDocuments: data.data.documents?.length || 0,
              verifiedDocuments: verifiedCount
            }
          });
        }
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('documents', 'Failed to load documents. Please try again.');
    } finally {
      setLoading('documents', false);
    }
  };
  
  // Grievances Functions
  const loadGrievances = async () => {
    if (!account) return;
    
    try {
      setLoading('grievances', true);
      clearError('grievances');
      
      const response = await fetch(`${API_BASE_URL}/api/grievances?address=${account}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          dispatch({
            type: DashboardActionTypes.SET_GRIEVANCES,
            payload: data.data.grievances || []
          });
          
          // Update stats
          if (data.data.stats) {
            dispatch({
              type: DashboardActionTypes.SET_STATS,
              payload: {
                pendingGrievances: data.data.stats.open + data.data.stats.inProgress,
                resolvedGrievances: data.data.stats.resolved + data.data.stats.closed
              }
            });
          }
        }
      } else {
        throw new Error('Failed to load grievances');
      }
    } catch (error) {
      console.error('Error loading grievances:', error);
      setError('grievances', 'Failed to load grievances. Please try again.');
    } finally {
      setLoading('grievances', false);
    }
  };
  
  // Initialize dashboard data when connected
  useEffect(() => {
    if (isConnected && account) {
      setLoading('general', true);
      
      Promise.all([
        loadProfile(),
        loadDocuments(),
        loadGrievances()
      ]).then(() => {
        setLoading('general', false);
      }).catch((error) => {
        console.error('Error loading dashboard data:', error);
        setLoading('general', false);
        setError('general', 'Failed to load dashboard data. Please refresh the page.');
      });
    }
  }, [isConnected, account]);
  
  // Context Value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    setLoading,
    setError,
    setSuccess,
    clearError,
    clearSuccess,
    
    // Profile Actions
    loadProfile,
    saveProfile,
    updateProfileField,
    setEditingProfile,
    
    // Document Actions
    loadDocuments,
    
    // Grievance Actions
    loadGrievances,
    
    // Dispatch for custom actions
    dispatch,
    actionTypes: DashboardActionTypes
  };
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom Hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;