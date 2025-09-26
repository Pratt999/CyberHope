import React from 'react';
import { Wallet, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export const WalletConnect: React.FC = () => {
  const { isConnected, account, connectWallet, disconnectWallet, isLoading, error, chainId } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 1337: return 'Local Network';
      case 5777: return 'Ganache';
      default: return `Chain ${chainId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-sm text-gray-300">Connecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <button
          onClick={connectWallet}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Wallet className="h-5 w-5" />
          <span className="font-medium">Connect MetaMask</span>
        </button>
        
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-sm font-medium text-white">
              {account && formatAddress(account)}
            </p>
            <p className="text-xs text-gray-400">
              {chainId && getNetworkName(chainId)}
            </p>
          </div>
        </div>
        
        <button
          onClick={disconnectWallet}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Disconnect
        </button>
      </div>

      {chainId && chainId !== 5777 && chainId !== 1337 && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">
            For testing, consider switching to a local network (Ganache/Hardhat)
          </span>
        </div>
      )}
    </div>
  );
};