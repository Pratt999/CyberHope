import React, { useState, useEffect } from 'react';
import { FileText, Eye, Users, Clock, Shield, AlertCircle, Bell } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';

interface Evidence {
  id: number;
  victim: string;
  ipfsHash: string;
  encryptedKey: string;
  timestamp: number;
  description: string;
  isActive: boolean;
  hasAccess: boolean;
  hasRequested: boolean;
  pendingRequests?: number;
}

export const EvidenceList: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { getUserEvidences, getEvidence, getPermissionRequests } = useContract();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && account) {
      loadUserEvidences();
    }
  }, [isConnected, account]);

  const loadUserEvidences = async () => {
    if (!account) return;

    setIsLoading(true);
    setError(null);

    try {
      const evidenceIds = await getUserEvidences(account);
      const evidencePromises = evidenceIds.map(async (id) => {
        const evidence = await getEvidence(id);
        const requests = await getPermissionRequests(id);
        const pendingRequests = requests.filter((req: any) => req.status === 'pending').length;
        return { ...evidence, pendingRequests };
      });
      const evidenceData = await Promise.all(evidencePromises);
      setEvidences(evidenceData);
    } catch (err: any) {
      console.error('Failed to load evidences:', err);
      setError('Failed to load your evidences');
    } finally {
      setIsLoading(false);
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

  const viewEvidence = (evidence: Evidence) => {
    if (evidence.hasAccess && evidence.ipfsHash) {
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

  const handleManageAccess = (evidenceId: number) => {
    setSelectedEvidenceId(evidenceId);
    // Trigger a custom event to switch to access control tab
    window.dispatchEvent(new CustomEvent('switchToAccessControl', { 
      detail: { evidenceId } 
    }));
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to view your evidence</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading your evidence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-400 mb-2">Error</h3>
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={loadUserEvidences}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (evidences.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Evidence Found</h3>
        <p className="text-gray-500">You haven't submitted any evidence yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Your Evidence</h2>
        <span className="px-2 py-1 bg-blue-600 text-white text-sm rounded-full">
          {evidences.length}
        </span>
      </div>

      <div className="grid gap-6">
        {evidences.map((evidence) => (
          <div
            key={evidence.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
          >
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

            <div className="space-y-3">
              <p className="text-gray-300">{evidence.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(evidence.timestamp)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Encrypted</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  IPFS: {evidence.ipfsHash ? `${evidence.ipfsHash.slice(0, 12)}...` : 'N/A'}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => viewEvidence(evidence)}
                    disabled={!evidence.hasAccess || !evidence.ipfsHash}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors disabled:cursor-not-allowed"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  
                  <button 
                    onClick={() => handleManageAccess(evidence.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors relative"
                  >
                    <Users className="h-4 w-4" />
                    <span>Manage Access</span>
                    {evidence.pendingRequests && evidence.pendingRequests > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                        {evidence.pendingRequests}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};