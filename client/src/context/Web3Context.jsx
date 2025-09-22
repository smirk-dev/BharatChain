import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum;
  };

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sanitize address to prevent ENS resolution issues
  const sanitizeAddress = (address) => {
    if (!address) return null;
    // Convert to lowercase and remove any whitespace
    const sanitized = address.toLowerCase().trim();
    // Validate format
    if (ethers.isAddress(sanitized)) {
      return sanitized;
    }
    return null;
  };

  // Get authentication message from backend
  const getAuthMessage = async (address) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      // Add timeout and retry logic
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = fetch(`${apiUrl}/api/auth/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to get authentication message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting auth message:', error);
      
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new Error('Backend server is not running. Please start the server on port 3001.');
      }
      
      throw error;
    }
  };

  // Authenticate with backend using signature
  const authenticateWithBackend = async (address, signature, nonce) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          nonce,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error('Error authenticating with backend:', error);
      throw error;
    }
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Check if MetaMask is unlocked
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        
        if (accounts.length === 0) {
          // Request account access if no accounts are available
          const requestedAccounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          
          if (requestedAccounts.length === 0) {
            throw new Error('No accounts found. Please connect to MetaMask.');
          }
        }
      } catch (accountError) {
        if (accountError.code === 4001) {
          throw new Error('MetaMask connection was rejected by user.');
        }
        throw new Error('Failed to access MetaMask accounts. Please make sure MetaMask is unlocked.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect to MetaMask.');
      }

      const rawAddress = accounts[0];
      const sanitizedAddress = sanitizeAddress(rawAddress);

      if (!sanitizedAddress) {
        throw new Error('Invalid account address received from MetaMask.');
      }

      // Create provider without specifying network (let it auto-detect)
      const web3Provider = new ethers.BrowserProvider(window.ethereum);

      // Get signer
      const web3Signer = await web3Provider.getSigner();

      // Get network info
      const network = await web3Provider.getNetwork();

      // Get authentication message from backend
      const authData = await getAuthMessage(sanitizedAddress);

      // Sign the authentication message
      const signature = await web3Signer.signMessage(authData.data.message);

      // Authenticate with backend
      const token = await authenticateWithBackend(
        sanitizedAddress,
        signature,
        authData.data.nonce
      );

      // Update state
      setAccount(sanitizedAddress);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(network.chainId.toString());
      setAuthToken(token);
      setIsConnected(true);

      // Store in localStorage for persistence
      localStorage.setItem('bharatchain_address', sanitizedAddress);
      localStorage.setItem('bharatchain_token', token);
      localStorage.setItem('bharatchain_connected', 'true');

    } catch (error) {
      console.error('Wallet connection error:', error);
      let errorMessage = error.message;
      
      // Provide user-friendly error messages
      if (error.message.includes('user rejected') || error.code === 4001) {
        errorMessage = 'Connection was cancelled by user.';
      } else if (error.message.includes('Backend server is not running')) {
        errorMessage = 'Backend server is not available. Please start the server and try again.';
      } else if (error.message.includes('MetaMask is locked')) {
        errorMessage = 'Please unlock your MetaMask wallet and try again.';
      }
      
      setError(errorMessage);
      
      // Reset state on error
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setAuthToken(null);
      setIsConnected(false);
      
      // Clear localStorage
      localStorage.removeItem('bharatchain_address');
      localStorage.removeItem('bharatchain_token');
      localStorage.removeItem('bharatchain_connected');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      // Clear state
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setAuthToken(null);
      setIsConnected(false);
      setChainId(null);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('bharatchain_address');
      localStorage.removeItem('bharatchain_token');
      localStorage.removeItem('bharatchain_connected');

    } catch (error) {
      console.error('Disconnect error:', error);
      setError('Failed to disconnect wallet');
    }
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      const newAddress = sanitizeAddress(accounts[0]);
      if (newAddress && newAddress !== account) {
        // Account changed, reconnect
        connectWallet();
      }
    }
  }, [account, connectWallet, disconnectWallet]);

  // Handle chain changes
  const handleChainChanged = useCallback((newChainId) => {
    setChainId(newChainId);
    // Optionally reconnect to update provider
    if (isConnected) {
      window.location.reload(); // Simple approach to handle chain changes
    }
  }, [isConnected]);

  // Auto-connect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;

      const wasConnected = localStorage.getItem('bharatchain_connected');
      const storedAddress = localStorage.getItem('bharatchain_address');
      const storedToken = localStorage.getItem('bharatchain_token');

      if (wasConnected && storedAddress && storedToken) {
        try {
          // Check if accounts are still accessible
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0 && sanitizeAddress(accounts[0]) === storedAddress) {
            // Verify token is still valid (optional)
            // For now, just restore the connection
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setAccount(storedAddress);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setAuthToken(storedToken);
            setChainId(network.chainId.toString());
            setIsConnected(true);
          } else {
            // Clear invalid stored data
            localStorage.removeItem('bharatchain_address');
            localStorage.removeItem('bharatchain_token');
            localStorage.removeItem('bharatchain_connected');
          }
        } catch (error) {
          console.error('Auto-connect error:', error);
          // Clear invalid stored data
          localStorage.removeItem('bharatchain_address');
          localStorage.removeItem('bharatchain_token');
          localStorage.removeItem('bharatchain_connected');
        }
      }
    };

    autoConnect();
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const ethereum = window.ethereum;

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Get network name
  const getNetworkName = (chainId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
      '1337': 'Localhost',
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const value = {
    // State
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    error,
    authToken,
    
    // Actions
    connectWallet,
    disconnectWallet,
    clearError,
    
    // Utilities
    isMetaMaskInstalled,
    getNetworkName,
    sanitizeAddress,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
