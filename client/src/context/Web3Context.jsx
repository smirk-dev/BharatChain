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
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Only initialize contracts if addresses are valid
      if (isValidContractAddress(CONTRACT_ADDRESSES.CitizenRegistry)) {
        await initializeContracts(signer);
      } else {
        console.log('Running in demo mode - no smart contracts to initialize');
      }

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
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
        console.log('Running in demo mode - no smart contracts deployed');
      }
    } catch (error) {
      console.error('Error initializing contracts:', error);
      // Don't show error toast for missing contracts in demo mode
      console.log('Smart contracts not available - running in demo mode');
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
      return ethers.isAddress(address);
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

            setProvider(provider);
            setSigner(signer);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            setIsConnected(true);

            // Only initialize contracts if addresses are valid
            if (isValidContractAddress(CONTRACT_ADDRESSES.CitizenRegistry)) {
              await initializeContracts(signer);
            }
          }
        } catch (error) {
          console.error('Error checking connection:', error);
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
          setAccount(accounts[0]);
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
