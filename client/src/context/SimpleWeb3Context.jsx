import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

const SimpleWeb3Context = createContext();

export const useSimpleWeb3 = () => {
  const context = useContext(SimpleWeb3Context);
  if (!context) {
    throw new Error('useSimpleWeb3 must be used within SimpleWeb3Provider');
  }
  return context;
};

export const SimpleWeb3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return { success: false, error: 'MetaMask not installed' };
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found. Please create a MetaMask account.');
        return { success: false, error: 'No accounts' };
      }

      // Sanitize the account address
      const cleanAccount = sanitizeAddress(accounts[0]);
      
      if (!cleanAccount) {
        toast.error('Invalid wallet address format.');
        return { success: false, error: 'Invalid address' };
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      setAccount(cleanAccount);
      setChainId(parseInt(chainId, 16));
      setIsConnected(true);

      toast.success('Wallet connected successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = 'Failed to connect wallet';
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  };

  const signMessage = async (message) => {
    try {
      if (!isConnected || !account) {
        throw new Error('Wallet not connected');
      }

      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      if (error.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      throw new Error('Failed to sign message: ' + error.message);
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

  const isValidAddress = (address) => {
    const sanitized = sanitizeAddress(address);
    return sanitized !== '';
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0) {
            const cleanAccount = sanitizeAddress(accounts[0]);
            
            if (cleanAccount) {
              const chainId = await window.ethereum.request({
                method: 'eth_chainId'
              });

              setAccount(cleanAccount);
              setChainId(parseInt(chainId, 16));
              setIsConnected(true);
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
          const cleanAccount = sanitizeAddress(accounts[0]);
          if (cleanAccount) {
            setAccount(cleanAccount);
          } else {
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
    account,
    chainId,
    isConnected,
    loading,
    connectWallet,
    disconnectWallet,
    signMessage,
    getNetworkName,
    isValidAddress,
  };

  return (
    <SimpleWeb3Context.Provider value={value}>
      {children}
    </SimpleWeb3Context.Provider>
  );
};
