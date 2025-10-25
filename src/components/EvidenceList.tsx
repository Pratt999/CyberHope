import React, { useState, useEffect } from 'react';
import { FileText, Eye, Users, Clock, Shield, AlertCircle, Bell, Key } from 'lucide-react';
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
  const { 
    getUserEvidences, 
    getEvidence, 
    getPermissionRequests, 
    requestAccess, 
    isContractReady 
  } = useContract();

  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && account && isContractReady) {
      loadUserEvidences();
    }
  }, [isConnected, account, isContractReady]);

  const loadUserEvidences = async () => {
    if (!account || !isContractReady) return;

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

  const handleRequestAccess = async (evidenceId: number) => {
    try {
      await requestAccess(evidenceId);
      alert('Access request sent successfully.');
      await loadUserEvidences();
    } catch (err: any) {
      console.error('Access request failed:', err);
      alert('Failed to send access request.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const viewEvidence = (evidence: Evidence) => {
    if (evidence.hasAccess && evidence.ipfsHash) {
      const mockUrl = localStorage.getItem(`ipfs_${evidence.ipfsHash}`);
      if (mockUrl) {
        window.open(mockUrl, '_blank');
      } else {
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${evidence.ipfsHash}`;
        window.open(ipfsUrl, '_blank');
      }
    } else {
      alert('You do not have access to view this evidence.');
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to view evidence</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading evidence...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Evidence</h2>
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
            </div>

            <p className="text-gray-300 mb-3">{evidence.description}</p>
            <p className="text-gray-400 text-sm mb-2">
              <Clock className="inline-block h-4 w-4 mr-1" />
              {formatDate(evidence.timestamp)}
            </p>

            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
              <div className="text-sm text-gray-400">
                IPFS: {evidence.ipfsHash ? `${evidence.ipfsHash.slice(0, 12)}...` : 'N/A'}
              </div>
              <div className="flex space-x-2">
                {evidence.hasAccess ? (
                  <button
                    onClick={() => viewEvidence(evidence)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestAccess(evidence.id)}
                    disabled={evidence.hasRequested}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    <Key className="h-4 w-4" />
                    <span>
                      {evidence.hasRequested ? 'Requested' : 'Request Access'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
