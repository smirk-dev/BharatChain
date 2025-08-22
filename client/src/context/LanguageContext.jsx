import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations for different languages
const translations = {
  en: {
    // Header
    appTitle: 'BharatChain - Digital Governance Platform',
    // Removed demo mode references
    
    // Navigation
    profile: 'Profile',
    documents: 'Documents',
    grievances: 'Grievances',
    analytics: 'Analytics',
    healthcare: 'Healthcare',
    
    // Common
    loading: 'Loading...',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    
    // Profile
    citizenProfile: 'Citizen Profile',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    verified: 'Verified',
    pending: 'Pending',
    
    // Documents
    myDocuments: 'My Documents',
    uploadDocument: 'Upload Document',
    documentType: 'Document Type',
    uploadDate: 'Upload Date',
    
    // Grievances
    myGrievances: 'My Grievances',
    submitGrievance: 'Submit Grievance',
    grievanceTitle: 'Title',
    description: 'Description',
    category: 'Category',
    priority: 'Priority',
    location: 'Location',
    
    // Healthcare
    healthcareServices: 'Healthcare Services',
    appointments: 'Appointments',
    medicalRecords: 'Medical Records',
    vaccinations: 'Vaccinations',
    insuranceClaims: 'Insurance Claims',
    bookAppointment: 'Book Appointment',
    doctor: 'Doctor',
    hospital: 'Hospital',
    department: 'Department',
    
    // Analytics
    analyticsDashboard: 'Analytics Dashboard',
    totalCitizens: 'Total Citizens',
    resolutionRate: 'Resolution Rate',
    monthlyTrends: 'Monthly Trends',
    recentActivity: 'Recent Activity',
    
    // Status
    confirmed: 'Confirmed',
    completed: 'Completed',
    approved: 'Approved',
    processing: 'Processing',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    
    // Welcome
    welcome: 'Welcome to BharatChain',
    welcomeSubtitle: "India's Digital Governance Platform on Blockchain",
    welcomeDescription: 'Secure citizen registration, document management, and grievance redressal system powered by blockchain technology.',
    accessDemo: 'Access Demo Dashboard',
  },
  
  hi: {
    // Header
    appTitle: 'भारतचेन - डिजिटल गवर्नेंस प्लेटफॉर्म',
    demoMode: 'डेमो मोड',
    
    // Navigation
    profile: 'प्रोफाइल',
    documents: 'दस्तावेज़',
    grievances: 'शिकायतें',
    analytics: 'विश्लेषण',
    healthcare: 'स्वास्थ्य सेवा',
    
    // Common
    loading: 'लोड हो रहा है...',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    edit: 'संपादित करें',
    delete: 'मिटाएं',
    view: 'देखें',
    download: 'डाउनलोड करें',
    upload: 'अपलोड करें',
    status: 'स्थिति',
    date: 'तारीख',
    actions: 'कार्य',
    
    // Profile
    citizenProfile: 'नागरिक प्रोफाइल',
    name: 'नाम',
    email: 'ईमेल',
    phone: 'फोन',
    address: 'पता',
    verified: 'सत्यापित',
    pending: 'लंबित',
    
    // Documents
    myDocuments: 'मेरे दस्तावेज़',
    uploadDocument: 'दस्तावेज़ अपलोड करें',
    documentType: 'दस्तावेज़ प्रकार',
    uploadDate: 'अपलोड तारीख',
    
    // Grievances
    myGrievances: 'मेरी शिकायतें',
    submitGrievance: 'शिकायत दर्ज करें',
    grievanceTitle: 'शीर्षक',
    description: 'विवरण',
    category: 'श्रेणी',
    priority: 'प्राथमिकता',
    location: 'स्थान',
    
    // Healthcare
    healthcareServices: 'स्वास्थ्य सेवाएं',
    appointments: 'अपॉइंटमेंट्स',
    medicalRecords: 'चिकित्सा रिकॉर्ड',
    vaccinations: 'टीकाकरण',
    insuranceClaims: 'बीमा दावे',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    doctor: 'डॉक्टर',
    hospital: 'अस्पताल',
    department: 'विभाग',
    
    // Analytics
    analyticsDashboard: 'विश्लेषण डैशबोर्ड',
    totalCitizens: 'कुल नागरिक',
    resolutionRate: 'समाधान दर',
    monthlyTrends: 'मासिक रुझान',
    recentActivity: 'हाल की गतिविधि',
    
    // Status
    confirmed: 'पुष्ट',
    completed: 'पूर्ण',
    approved: 'अनुमोदित',
    processing: 'प्रसंस्करण',
    rejected: 'अस्वीकृत',
    cancelled: 'रद्द',
    
    // Welcome
    welcome: 'भारतचेन में आपका स्वागत है',
    welcomeSubtitle: 'ब्लॉकचेन पर भारत का डिजिटल गवर्नेंस प्लेटफॉर्म',
    welcomeDescription: 'ब्लॉकचेन तकनीक द्वारा संचालित सुरक्षित नागरिक पंजीकरण, दस्तावेज़ प्रबंधन और शिकायत निवारण प्रणाली।',
    accessDemo: 'डेमो डैशबोर्ड एक्सेस करें',
  },
  
  ta: {
    // Header
    appTitle: 'பாரதசங் - டிஜிட்டல் ஆளுமை தளம்',
    demoMode: 'மாதிரி முறை',
    
    // Navigation
    profile: 'சுயவிவரம்',
    documents: 'ஆவணங்கள்',
    grievances: 'புகார்கள்',
    analytics: 'பகுப்பாய்வு',
    healthcare: 'சுகாதார சேவை',
    
    // Common
    loading: 'ஏற்றுகிறது...',
    submit: 'சமர்ப்பிக்கவும்',
    cancel: 'ரத்து செய்யவும்',
    save: 'சேமிக்கவும்',
    edit: 'திருத்தவும்',
    delete: 'நீக்கவும்',
    view: 'பார்க்கவும்',
    download: 'பதிவிறக்கவும்',
    upload: 'பதிவேற்றவும்',
    status: 'நிலை',
    date: 'தேதி',
    actions: 'செயல்கள்',
    
    // Profile
    citizenProfile: 'குடிமகன் சுயவிவரம்',
    name: 'பெயர்',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
    address: 'முகவரி',
    verified: 'சரிபார்க்கப்பட்டது',
    pending: 'நிலுவையில்',
    
    // Documents
    myDocuments: 'என் ஆவணங்கள்',
    uploadDocument: 'ஆவணத்தை பதிவேற்றவும்',
    documentType: 'ஆவண வகை',
    uploadDate: 'பதிவேற்ற தேதி',
    
    // Grievances
    myGrievances: 'என் புகார்கள்',
    submitGrievance: 'புகார் சமர்ப்பிக்கவும்',
    grievanceTitle: 'தலைப்பு',
    description: 'விளக்கம்',
    category: 'வகை',
    priority: 'முன்னுரிமை',
    location: 'இடம்',
    
    // Healthcare
    healthcareServices: 'சுகாதார சேவைகள்',
    appointments: 'நியமனங்கள்',
    medicalRecords: 'மருத்துவ பதிவுகள்',
    vaccinations: 'தடுப்பூசிகள்',
    insuranceClaims: 'காப்பீட்டு கோரிக்கைகள்',
    bookAppointment: 'நியமனம் பதிவு செய்யவும்',
    doctor: 'மருத்துவர்',
    hospital: 'மருத்துவமனை',
    department: 'துறை',
    
    // Analytics
    analyticsDashboard: 'பகுப்பாய்வு பலகை',
    totalCitizens: 'மொத்த குடிமக்கள்',
    resolutionRate: 'தீர்வு விகிதம்',
    monthlyTrends: 'மாதாந்திர போக்குகள்',
    recentActivity: 'சமீபத்திய செயல்பாடு',
    
    // Status
    confirmed: 'உறுதிப்படுத்தப்பட்டது',
    completed: 'முடிக்கப்பட்டது',
    approved: 'அங்கீகரிக்கப்பட்டது',
    processing: 'செயலாக்கம்',
    rejected: 'நிராகரிக்கப்பட்டது',
    cancelled: 'ரத்து செய்யப்பட்டது',
    
    // Welcome
    welcome: 'பாரதசங்கிற்கு வரவேற்கிறோம்',
    welcomeSubtitle: 'பிளாக்செயினில் இந்தியாவின் டிஜிட்டல் ஆளுமை தளம்',
    welcomeDescription: 'பிளாக்செயின் தொழில்நுட்பத்தால் இயங்கும் பாதுகாப்பான குடிமகன் பதிவு, ஆவண மேலாண்மை மற்றும் புகார் தீர்வு அமைப்பு।',
    accessDemo: 'மாதிரி பலகையை அணுகவும்',
  },
  
  bn: {
    // Header
    appTitle: 'ভারতচেইন - ডিজিটাল গভর্নেন্স প্ল্যাটফর্ম',
    demoMode: 'ডেমো মোড',
    
    // Navigation
    profile: 'প্রোফাইল',
    documents: 'নথিপত্র',
    grievances: 'অভিযোগ',
    analytics: 'বিশ্লেষণ',
    healthcare: 'স্বাস্থ্যসেবা',
    
    // Common
    loading: 'লোড হচ্ছে...',
    submit: 'জমা দিন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    view: 'দেখুন',
    download: 'ডাউনলোড',
    upload: 'আপলোড',
    status: 'অবস্থা',
    date: 'তারিখ',
    actions: 'কর্ম',
    
    // Profile
    citizenProfile: 'নাগরিক প্রোফাইল',
    name: 'নাম',
    email: 'ইমেইল',
    phone: 'ফোন',
    address: 'ঠিকানা',
    verified: 'যাচাইকৃত',
    pending: 'অপেক্ষমাণ',
    
    // Documents
    myDocuments: 'আমার নথিপত্র',
    uploadDocument: 'নথি আপলোড',
    documentType: 'নথির ধরন',
    uploadDate: 'আপলোডের তারিখ',
    
    // Grievances
    myGrievances: 'আমার অভিযোগসমূহ',
    submitGrievance: 'অভিযোগ জমা দিন',
    grievanceTitle: 'শিরোনাম',
    description: 'বিবরণ',
    category: 'বিভাগ',
    priority: 'অগ্রাধিকার',
    location: 'অবস্থান',
    
    // Healthcare
    healthcareServices: 'স্বাস্থ্যসেবা',
    appointments: 'অ্যাপয়েন্টমেন্ট',
    medicalRecords: 'চিকিৎসা রেকর্ড',
    vaccinations: 'টিকাদান',
    insuranceClaims: 'বীমা দাবি',
    bookAppointment: 'অ্যাপয়েন্টমেন্ট বুক',
    doctor: 'ডাক্তার',
    hospital: 'হাসপাতাল',
    department: 'বিভাগ',
    
    // Analytics
    analyticsDashboard: 'বিশ্লেষণ ড্যাশবোর্ড',
    totalCitizens: 'মোট নাগরিক',
    resolutionRate: 'সমাধানের হার',
    monthlyTrends: 'মাসিক প্রবণতা',
    recentActivity: 'সাম্প্রতিক কার্যকলাপ',
    
    // Status
    confirmed: 'নিশ্চিত',
    completed: 'সম্পন্ন',
    approved: 'অনুমোদিত',
    processing: 'প্রক্রিয়াকরণ',
    rejected: 'প্রত্যাখ্যাত',
    cancelled: 'বাতিল',
    
    // Welcome
    welcome: 'ভারতচেইনে স্বাগতম',
    welcomeSubtitle: 'ব্লকচেইনে ভারতের ডিজিটাল গভর্নেন্স প্ল্যাটফর্ম',
    welcomeDescription: 'ব্লকচেইন প্রযুক্তি দ্বারা চালিত নিরাপদ নাগরিক নিবন্ধন, নথি ব্যবস্থাপনা এবং অভিযোগ নিষ্পত্তি ব্যবস্থা।',
    accessDemo: 'ডেমো ড্যাশবোর্ড অ্যাক্সেস',
  }
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('bharatchain-language');
    return savedLanguage || 'en';
  });

  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('bharatchain-language', languageCode);
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations['en'][key] || key;
  };

  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('bharatchain-language');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: false, // None of our current languages use RTL
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
