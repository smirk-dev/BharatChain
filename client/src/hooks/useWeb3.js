import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Supported networks
  const SUPPORTED_NETWORKS = {
    1: 'Ethereum Mainnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai Testnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet'
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('connectedAccount', accounts[0]);

    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    
    // Clear stored connection state
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('connectedAccount');
  };

  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      // If network doesn't exist, add it (for testnets)
      if (err.code === 4902) {
        await addNetwork(targetChainId);
      } else {
        setError(`Failed to switch network: ${err.message}`);
      }
    }
  };

  const addNetwork = async (chainId) => {
    if (!window.ethereum) return;

    const networkParams = {
      80001: {
        chainId: '0x13881',
        chainName: 'Polygon Mumbai Testnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
      },
      5: {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://goerli.infura.io/v3/'],
        blockExplorerUrls: ['https://goerli.etherscan.io/'],
      },
    };

    if (networkParams[chainId]) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkParams[chainId]],
        });
      } catch (err) {
        setError(`Failed to add network: ${err.message}`);
      }
    }
  };

  const getBalance = async () => {
    if (!provider || !account) return null;

    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error getting balance:', err);
      return null;
    }
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
        await connectWallet();
      }
    };

    autoConnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          localStorage.setItem('connectedAccount', accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(parseInt(chainId, 16));
        // Reload page to reset state on network change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const getNetworkName = () => {
    return SUPPORTED_NETWORKS[chainId] || `Network ${chainId}`;
  };

  const isNetworkSupported = () => {
    return chainId && SUPPORTED_NETWORKS[chainId];
  };

  return {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    getNetworkName,
    isNetworkSupported,
    supportedNetworks: SUPPORTED_NETWORKS,
  };
};

export default useWeb3;
