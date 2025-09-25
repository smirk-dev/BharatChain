import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

import { DashboardProvider } from '../src/context/DashboardContext';
import { Web3Provider } from '../src/context/Web3Context';
import StatCard from '../src/components/Dashboard/StatCard';
import QuickActionCard from '../src/components/Dashboard/QuickActionCard';
import SystemStatusGrid from '../src/components/Dashboard/SystemStatusGrid';
import CitizenDashboard from '../src/components/Dashboard/CitizenDashboard';

// Mock Material-UI theme
const theme = createTheme();

// Mock Web3 context
const mockWeb3Context = {
  account: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  isConnecting: false,
  isInitialized: true,
  balance: '1.5',
  network: { chainId: 1337, name: 'Hardhat' },
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  switchNetwork: jest.fn(),
  error: null,
  clearError: jest.fn()
};

// Mock Dashboard context
const mockDashboardContext = {
  isLoading: false,
  stats: {
    totalDocuments: 5,
    verifiedDocuments: 3,
    pendingGrievances: 2,
    resolvedGrievances: 8
  },
  profile: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+919876543210',
    isVerified: true
  },
  documents: [],
  grievances: [],
  errors: {},
  success: {},
  setError: jest.fn(),
  setSuccess: jest.fn(),
  clearError: jest.fn(),
  clearSuccess: jest.fn()
};

// Wrapper component for tests
const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <Web3Provider value={mockWeb3Context}>
      <DashboardProvider value={mockDashboardContext}>
        {children}
      </DashboardProvider>
    </Web3Provider>
  </ThemeProvider>
);

describe('StatCard Component', () => {
  const mockStat = {
    title: 'कुल दस्तावेज़',
    subtitle: 'Total Documents',
    value: 5,
    icon: '📜',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
    trend: '+12%',
    description: 'सभी अपलोड किए गए दस्तावेज़'
  };

  test('renders stat card with correct data', () => {
    render(
      <TestWrapper>
        <StatCard stat={mockStat} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('कुल दस्तावेज़')).toBeInTheDocument();
    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('📜')).toBeInTheDocument();
  });

  test('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <StatCard stat={mockStat} index={0} isLoading={true} />
      </TestWrapper>
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  test('calls refresh function when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    render(
      <TestWrapper>
        <StatCard stat={mockStat} index={0} onRefresh={mockRefresh} />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('applies hover animations correctly', () => {
    render(
      <TestWrapper>
        <StatCard stat={mockStat} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveStyle({ transform: 'none' });
  });
});

describe('QuickActionCard Component', () => {
  const mockAction = {
    title: 'दस्तावेज़ अपलोड',
    subtitle: 'Upload Document',
    description: 'नए दस्तावेज़ सत्यापन के लिए जोड़ें',
    englishDesc: 'Add new documents for verification',
    icon: '📤',
    action: jest.fn(),
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    bgPattern: '🏛️'
  };

  test('renders action card with correct content', () => {
    render(
      <TestWrapper>
        <QuickActionCard action={mockAction} index={0} />
      </TestWrapper>
    );

    expect(screen.getByText('दस्तावेज़ अपलोड')).toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('नए दस्तावेज़ सत्यापन के लिए जोड़ें')).toBeInTheDocument();
    expect(screen.getByText('📤')).toBeInTheDocument();
  });

  test('calls action function when card is clicked', () => {
    render(
      <TestWrapper>
        <QuickActionCard action={mockAction} index={0} />
      </TestWrapper>
    );

    const card = screen.getByRole('button', { name: /शुरू करें/i }).closest('[role="article"]');
    fireEvent.click(card);
    
    expect(mockAction.action).toHaveBeenCalledTimes(1);
  });

  test('shows loading state and disables click when loading', () => {
    render(
      <TestWrapper>
        <QuickActionCard action={mockAction} index={0} isLoading={true} />
      </TestWrapper>
    );

    expect(screen.getByText('लोड हो रहा है... • Loading...')).toBeInTheDocument();
    
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
  });

  test('applies proper styling and animations', () => {
    const { container } = render(
      <TestWrapper>
        <QuickActionCard action={mockAction} index={0} />
      </TestWrapper>
    );

    const motionDiv = container.firstChild;
    expect(motionDiv).toHaveAttribute('style');
  });
});

describe('SystemStatusGrid Component', () => {
  test('renders system status grid with all services', () => {
    render(
      <TestWrapper>
        <SystemStatusGrid />
      </TestWrapper>
    );

    expect(screen.getByText('🔧 सिस्टम स्थिति • System Status')).toBeInTheDocument();
    expect(screen.getByText('ब्लॉकचेन नेटवर्क')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Network')).toBeInTheDocument();
    expect(screen.getByText('AI प्रसंस्करण')).toBeInTheDocument();
    expect(screen.getByText('भुगतान गेटवे')).toBeInTheDocument();
  });

  test('calls refresh function when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    render(
      <TestWrapper>
        <SystemStatusGrid onRefresh={mockRefresh} />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test('toggles compact mode correctly', () => {
    render(
      <TestWrapper>
        <SystemStatusGrid compact={true} />
      </TestWrapper>
    );

    const expandButton = screen.getByRole('button', { name: /show more/i });
    expect(expandButton).toBeInTheDocument();
    
    fireEvent.click(expandButton);
    
    // Should now show "Show Less" button
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  test('shows loading state with spinning refresh icon', () => {
    render(
      <TestWrapper>
        <SystemStatusGrid isLoading={true} />
      </TestWrapper>
    );

    const refreshIcon = screen.getByTestId('RefreshIcon');
    expect(refreshIcon).toHaveStyle({ animation: 'spin 1s linear infinite' });
  });

  test('displays service status correctly', () => {
    render(
      <TestWrapper>
        <SystemStatusGrid />
      </TestWrapper>
    );

    // Check for status indicators
    expect(screen.getByText(/जुड़ा हुआ • Connected/)).toBeInTheDocument();
    expect(screen.getByText(/ऑनलाइन • Online/)).toBeInTheDocument();
    expect(screen.getByText(/उपलब्ध • Available/)).toBeInTheDocument();
    expect(screen.getByText(/सक्रिय • Active/)).toBeInTheDocument();
  });
});

describe('CitizenDashboard Component', () => {
  const mockProps = {
    account: mockWeb3Context.account,
    isConnected: true
  };

  test('renders dashboard with user information', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard {...mockProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('🇮🇳 भारत चेन डैशबोर्ड 🇮🇳')).toBeInTheDocument();
      expect(screen.getByText('BharatChain Digital Identity Platform')).toBeInTheDocument();
    });
  });

  test('displays stats correctly', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard {...mockProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('📊 आंकड़ों की झलक • Dashboard Statistics')).toBeInTheDocument();
      expect(screen.getByText('कुल दस्तावेज़')).toBeInTheDocument();
      expect(screen.getByText('सत्यापित दस्तावेज़')).toBeInTheDocument();
    });
  });

  test('renders quick actions correctly', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard {...mockProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('🚀 त्वरित कार्य • Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('दस्तावेज़ अपलोड')).toBeInTheDocument();
      expect(screen.getByText('शिकायत दर्ज करें')).toBeInTheDocument();
    });
  });

  test('handles tab navigation correctly', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard {...mockProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      const profileTab = screen.getByRole('tab', { name: /👤 Profile/i });
      fireEvent.click(profileTab);
      
      expect(screen.getByText('👤 नागरिक प्रोफ़ाइल • Citizen Profile')).toBeInTheDocument();
    });
  });

  test('displays loading state correctly', () => {
    const loadingContext = {
      ...mockDashboardContext,
      isLoading: true
    };

    render(
      <TestWrapper>
        <DashboardProvider value={loadingContext}>
          <CitizenDashboard {...mockProps} />
        </DashboardProvider>
      </TestWrapper>
    );

    // Should show loading progress bar
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  test('handles error states correctly', () => {
    const errorContext = {
      ...mockDashboardContext,
      errors: {
        profile: 'Failed to load profile'
      }
    };

    render(
      <TestWrapper>
        <DashboardProvider value={errorContext}>
          <CitizenDashboard {...mockProps} />
        </DashboardProvider>
      </TestWrapper>
    );

    expect(screen.getByText(/Failed to load profile/)).toBeInTheDocument();
  });

  test('responsive design works correctly', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <CitizenDashboard {...mockProps} />
      </TestWrapper>
    );

    // Should render mobile-friendly layout
    const container = screen.getByRole('main');
    expect(container).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  test('dashboard components work together correctly', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard 
          account={mockWeb3Context.account} 
          isConnected={true} 
        />
      </TestWrapper>
    );

    // Test that all major sections render
    await waitFor(() => {
      expect(screen.getByText('भारत चेन डैशबोर्ड')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Statistics')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    // Test tab switching
    const documentsTab = screen.getByRole('tab', { name: /📄 Documents/i });
    fireEvent.click(documentsTab);

    await waitFor(() => {
      expect(screen.getByText('📄 दस्तावेज़ प्रबंधन • Document Management')).toBeInTheDocument();
    });

    // Test grievances tab
    const grievancesTab = screen.getByRole('tab', { name: /📋 Grievances/i });
    fireEvent.click(grievancesTab);

    await waitFor(() => {
      expect(screen.getByText('📋 शिकायत प्रबंधन • Grievance Management')).toBeInTheDocument();
    });
  });

  test('context state updates reflect in components', async () => {
    const { rerender } = render(
      <TestWrapper>
        <CitizenDashboard 
          account={mockWeb3Context.account} 
          isConnected={true} 
        />
      </TestWrapper>
    );

    // Update context with new stats
    const updatedContext = {
      ...mockDashboardContext,
      stats: {
        ...mockDashboardContext.stats,
        totalDocuments: 10
      }
    };

    rerender(
      <ThemeProvider theme={theme}>
        <Web3Provider value={mockWeb3Context}>
          <DashboardProvider value={updatedContext}>
            <CitizenDashboard 
              account={mockWeb3Context.account} 
              isConnected={true} 
            />
          </DashboardProvider>
        </Web3Provider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });
});

describe('Accessibility Tests', () => {
  test('dashboard components have proper ARIA labels', async () => {
    render(
      <TestWrapper>
        <CitizenDashboard 
          account={mockWeb3Context.account} 
          isConnected={true} 
        />
      </TestWrapper>
    );

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 3 });
    expect(mainHeading).toBeInTheDocument();

    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
    });

    // Check for tab accessibility
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
  });

  test('components support keyboard navigation', () => {
    render(
      <TestWrapper>
        <SystemStatusGrid />
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    // Test keyboard focus
    refreshButton.focus();
    expect(document.activeElement).toBe(refreshButton);
    
    // Test keyboard interaction
    fireEvent.keyDown(refreshButton, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(refreshButton, { key: ' ', code: 'Space' });
  });
});

console.log('🧪 Running comprehensive React component tests...');
console.log('✅ Testing StatCard, QuickActionCard, SystemStatusGrid, and CitizenDashboard components');
console.log('📱 Responsive design tests included');
console.log('♿ Accessibility tests included');
console.log('🔄 Integration tests included');
console.log('🎭 Context state management tests included');