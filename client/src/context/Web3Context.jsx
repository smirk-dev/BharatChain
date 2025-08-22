import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Contract ABIs - with error handling for missing files
let CitizenRegistryABI = { abi: [] };
let DocumentRegistryABI = { abi: [] };
let GrievanceSystemABI = { abi: [] };

try {
  CitizenRegistryABI = require('../contracts/CitizenRegistry.json');
} catch (error) {
  console.log('CitizenRegistry ABI not found, using empty ABI');
}

try {
  DocumentRegistryABI = require('../contracts/DocumentRegistry.json');
} catch (error) {
  console.log('DocumentRegistry ABI not found, using empty ABI');
}

try {
  GrievanceSystemABI = require('../contracts/GrievanceSystem.json');
} catch (error) {
  console.log('GrievanceSystem ABI not found, using empty ABI');
}

// Utility function to sanitize wallet addresses and remove any invisible characters
const sanitizeAddress = (address) => {
  if (!address) return '';
  
  // Remove all non-visible characters, whitespace, and normalize
  const cleaned = address
    .toString()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
    .replace(/\s/g, '') // Remove all whitespace
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .toLowerCase()
    .trim();
  
  // Validate it's a proper Ethereum address format
  if (!/^0x[a-f0-9]{40}$/i.test(cleaned)) {
    console.warn('Invalid address format:', cleaned);
    return '';
  }
  
  return cleaned;
};

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(false);

  // Contract addresses (you'll need to update these after deployment)
  const CONTRACT_ADDRESSES = {
    CitizenRegistry: process.env.REACT_APP_CITIZEN_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
    DocumentRegistry: process.env.REACT_APP_DOCUMENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
    GrievanceSystem: process.env.REACT_APP_GRIEVANCE_SYSTEM_ADDRESS || '0x0000000000000000000000000000000000000000',
  };

  // Helper function to check if address is valid and not a placeholder
  const isValidContractAddress = (address) => {
    return address && 
           address !== '' && 
           address !== '0x0000000000000000000000000000000000000000' &&
           ethers.isAddress(address);
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return { success: false, error: 'MetaMask not installed' };
      }

      // Check if MetaMask is locked
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
      } catch (lockError) {
        if (lockError.code === 4001) {
          toast.error('Please unlock MetaMask to connect.');
          return { success: false, error: 'MetaMask locked' };
        }
        throw lockError;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Override the provider's resolveName method to prevent ENS resolution issues
      const originalResolveName = provider.resolveName;
      provider.resolveName = function(name) {
        // If it looks like an address, return it directly without ENS resolution
        if (typeof name === 'string' && /^0x[a-fA-F0-9]{40}$/i.test(name.trim())) {
          return Promise.resolve(name.trim().toLowerCase());
        }
        // For actual ENS names, use the original method
        return originalResolveName.call(this, name);
      };
      
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found. Please create a MetaMask account.');
        return { success: false, error: 'No accounts' };
      }

      // Sanitize the account address to prevent ENS resolution issues
      const cleanAccount = sanitizeAddress(accounts[0]);
      
      if (!cleanAccount) {
        toast.error('Invalid wallet address format.');
        return { success: false, error: 'Invalid address' };
      }

      // Use the provider directly without triggering ENS resolution
      const signer = await provider.getSigner();
      
      // Override the signer's resolveName method to prevent ENS resolution
      const originalResolveName = signer.resolveName;
      signer.resolveName = function(name) {
        // If it looks like an address, return it directly without ENS resolution
        if (typeof name === 'string' && /^0x[a-fA-F0-9]{40}$/i.test(name.trim())) {
          return Promise.resolve(name.trim().toLowerCase());
        }
        // For actual ENS names, use the original method
        return originalResolveName.call(this, name);
      };
      
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(cleanAccount);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Only initialize contracts if addresses are valid
      if (isValidContractAddress(CONTRACT_ADDRESSES.CitizenRegistry)) {
        await initializeContracts(signer);
      } else {
        console.log('Smart contracts not available - please deploy contracts first');
      }

      toast.success('Wallet connected successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (error.message?.includes('already pending')) {
        errorMessage = 'Connection request already pending';
      } else if (error.message?.includes('ENS')) {
        errorMessage = 'Network connection issue - please try again';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setContracts({});
    toast.success('Wallet disconnected');
  };

  const initializeContracts = async (signer) => {
    try {
      const contracts = {};

      // Only initialize contracts if valid addresses are provided
      if (isValidContractAddress(CONTRACT_ADDRESSES.CitizenRegistry)) {
        contracts.citizenRegistry = new ethers.Contract(
          CONTRACT_ADDRESSES.CitizenRegistry,
          CitizenRegistryABI.abi,
          signer
        );
      }

      if (isValidContractAddress(CONTRACT_ADDRESSES.DocumentRegistry)) {
        contracts.documentRegistry = new ethers.Contract(
          CONTRACT_ADDRESSES.DocumentRegistry,
          DocumentRegistryABI.abi,
          signer
        );
      }

      if (isValidContractAddress(CONTRACT_ADDRESSES.GrievanceSystem)) {
        contracts.grievanceSystem = new ethers.Contract(
          CONTRACT_ADDRESSES.GrievanceSystem,
          GrievanceSystemABI.abi,
          signer
        );
      }

      setContracts(contracts);
      
      if (Object.keys(contracts).length > 0) {
        console.log('Smart contracts initialized successfully');
      } else {
        console.log('Smart contracts not deployed - please deploy contracts first');
      }
    } catch (error) {
      console.error('Error initializing contracts:', error);
      // Show error for missing contracts in production
      console.log('Smart contracts not available - please deploy contracts first');
    }
  };

  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  };

  const getNetworkName = () => {
    if (!chainId) return 'Unknown';
    
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      1337: 'Localhost',
      31337: 'Hardhat Network'
    };
    
    return networks[chainId] || `Network ${chainId}`;
  };

  const isNetworkSupported = () => {
    const supportedNetworks = [1, 3, 4, 5, 11155111, 137, 80001, 1337, 31337];
    return supportedNetworks.includes(chainId);
  };

  const isValidAddress = (address) => {
    try {
      const sanitized = sanitizeAddress(address);
      return sanitized !== '' && ethers.isAddress(sanitized);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected without triggering connection dialog
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            // Sanitize the account address to prevent ENS resolution issues
            const cleanAccount = sanitizeAddress(accounts[0]);
            
            if (!cleanAccount) {
              console.warn('Invalid wallet address format on reconnection');
              return;
            }

            setProvider(provider);
            setSigner(signer);
            setAccount(cleanAccount);
            setChainId(Number(network.chainId));
            setIsConnected(true);

            // Only initialize contracts if addresses are valid
            if (isValidContractAddress(CONTRACT_ADDRESSES.CitizenRegistry)) {
              await initializeContracts(signer);
            }
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          // Don't show error toast here as this runs on page load
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Sanitize the account address to prevent ENS resolution issues
          const cleanAccount = sanitizeAddress(accounts[0]);
          if (cleanAccount) {
            setAccount(cleanAccount);
          } else {
            console.warn('Invalid wallet address format on account change');
            disconnectWallet();
          }
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    contracts,
    loading,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getNetworkName,
    isNetworkSupported,
    isValidAddress,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
