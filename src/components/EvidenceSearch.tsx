import React, { useState } from 'react';
import { Search, Eye, Lock, AlertCircle, FileText, Clock } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';

export const EvidenceSearch: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { getEvidence, requestAccess, isLoading } = useContract();
  
  const [searchId, setSearchId] = useState('');
  const [evidence, setEvidence] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      setSearchError('Please enter an evidence ID');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setEvidence(null);

    try {
      const evidenceData = await getEvidence(parseInt(searchId));
      setEvidence(evidenceData);
    } catch (error: any) {
      console.error('Search failed:', error);
      setSearchError('Evidence not found or access denied');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!evidence) return;

    try {
      await requestAccess(evidence.id);
      // Refresh evidence data
      const updatedEvidence = await getEvidence(evidence.id);
      setEvidence(updatedEvidence);
    } catch (error: any) {
      console.error('Request access failed:', error);
      setSearchError('Failed to request access');
    }
  };

  const viewEvidence = () => {
    if (evidence?.hasAccess && evidence?.ipfsHash) {
      // Check if we have a mock file stored locally
      const mockUrl = localStorage.getItem(`ipfs_${evidence.ipfsHash}`);
      if (mockUrl) {
        window.open(mockUrl, '_blank');
      } else {
        // Try the IPFS gateway
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${evidence.ipfsHash}`;
        window.open(ipfsUrl, '_blank');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Lock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to search for evidence</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Search className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Search Evidence</h2>
      </div>

      {/* Search Form */}
      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="evidenceId" className="block text-sm font-medium text-gray-300 mb-2">
              Evidence ID
            </label>
            <div className="flex space-x-3">
              <input
                id="evidenceId"
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter evidence ID (e.g., 1, 2, 3...)"
                min="1"
              />
              <button
                type="submit"
                disabled={isSearching || !searchId.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>

          {searchError && (
            <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{searchError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      {evidence && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  Evidence #{evidence.id}
                </h3>
                <p className="text-gray-400 text-sm">
                  Victim: {formatAddress(evidence.victim)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {evidence.isActive ? (
                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
              <p className="text-white">{evidence.description}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(evidence.timestamp)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Lock className="h-4 w-4" />
                <span>Encrypted</span>
              </div>
            </div>

            {/* Access Status */}
            <div className="pt-4 border-t border-gray-700">
              {evidence.victim.toLowerCase() === account?.toLowerCase() ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">You own this evidence</span>
                </div>
              ) : evidence.hasAccess ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">You have access to this evidence</span>
                  </div>
                  <button
                    onClick={viewEvidence}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Evidence</span>
                  </button>
                </div>
              ) : evidence.hasRequested ? (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Access request pending approval</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-400">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Access required to view this evidence</span>
                  </div>
                  <button
                    onClick={handleRequestAccess}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{isLoading ? 'Requesting...' : 'Request Access'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* IPFS Information */}
            {evidence.hasAccess && evidence.ipfsHash && (
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Storage Information</h4>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">IPFS Hash:</p>
                  <p className="text-white font-mono text-sm break-all">{evidence.ipfsHash}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">How to Search Evidence</h3>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Enter the evidence ID number to search for specific evidence</li>
          <li>• You can view evidence you own or have been granted access to</li>
          <li>• Request access from the victim if you need to view protected evidence</li>
          <li>• All access requests are recorded on the blockchain for transparency</li>
        </ul>
      </div>
    </div>
  );
};