import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// Contract ABIs (you'll need to import these from your compiled contracts)
import CitizenRegistryABI from '../contracts/CitizenRegistry.json';
import DocumentRegistryABI from '../contracts/DocumentRegistry.json';
import GrievanceSystemABI from '../contracts/GrievanceSystem.json';

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

      // Initialize contracts
      await initializeContracts(signer);

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
      const citizenRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.CitizenRegistry,
        CitizenRegistryABI.abi,
        signer
      );

      const documentRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.DocumentRegistry,
        DocumentRegistryABI.abi,
        signer
      );

      const grievanceSystem = new ethers.Contract(
        CONTRACT_ADDRESSES.GrievanceSystem,
        GrievanceSystemABI.abi,
        signer
      );

      setContracts({
        citizenRegistry,
        documentRegistry,
        grievanceSystem,
      });
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize smart contracts');
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
            if (CONTRACT_ADDRESSES.CitizenRegistry !== '0x0000000000000000000000000000000000000000') {
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
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
