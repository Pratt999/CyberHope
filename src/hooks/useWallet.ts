import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  isConnected: boolean;
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    provider: null,
    signer: null,
    chainId: null,
    isLoading: true,
    error: null,
  });

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setWalletState(prev => ({ ...prev, error: 'MetaMask not installed' }));
        return;
      }

      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setWalletState({
        isConnected: true,
        account: accounts[0],
        provider,
        signer,
        chainId: Number(network.chainId),
        isLoading: false,
        error: null,
      });

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isLoading: false,
      }));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      account: null,
      provider: null,
      signer: null,
      chainId: null,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('walletConnected');
  };

  const switchNetwork = async (chainId: number) => {
    try {
      if (!window.ethereum) return;

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      setWalletState(prev => ({ ...prev, error: error.message }));
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_accounts', []);
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            setWalletState({
              isConnected: true,
              account: accounts[0],
              provider,
              signer,
              chainId: Number(network.chainId),
              isLoading: false,
              error: null,
            });
          } else {
            setWalletState(prev => ({ ...prev, isLoading: false }));
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          setWalletState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setWalletState(prev => ({ ...prev, isLoading: false }));
      }
    };

    autoConnect();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletState(prev => ({ ...prev, account: accounts[0] }));
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        setWalletState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};