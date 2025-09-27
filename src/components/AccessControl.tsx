import React, { useState, useEffect } from 'react';
import { Users, Shield, Clock, Check, X, AlertCircle, UserPlus, UserMinus, Search, Bell, Eye } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';

interface AccessRequest {
  id: string;
  address: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
  evidenceId?: number;
  evidenceDescription?: string;
}

interface GrantedAccess {
  address: string;
  grantedAt: number;
}

interface Evidence {
  id: number;
  description: string;
  accessRequests?: AccessRequest[];
  grantedAccess?: GrantedAccess[];
}

export const AccessControl: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { getUserEvidences, getEvidence, grantAccess, denyAccess, revokeAccess, getPermissionRequests, getAllAccessRequests, isLoading, isContractReady } = useContract();
  
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [allAccessRequests, setAllAccessRequests] = useState<AccessRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'manage' | 'requests'>('manage');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');

  useEffect(() => {
    if (isConnected && account && isContractReady) {
      loadUserEvidences();
      loadAllAccessRequests();
    }
  }, [isConnected, account, isContractReady]);

  const loadUserEvidences = async () => {
    if (!account || !isContractReady) return;

    setIsLoadingData(true);
    try {
      const evidenceIds = await getUserEvidences(account);
      const evidencePromises = evidenceIds.map(async (id: number) => {
        const evidence = await getEvidence(id);
        const requests = await getPermissionRequests(id);
        return {
          ...evidence,
          accessRequests: requests,
          grantedAccess: evidence.grantedAccess || []
        };
      });
      
      const evidenceData = await Promise.all(evidencePromises);
      setEvidences(evidenceData);
    } catch (error) {
      console.error('Failed to load evidences:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAllAccessRequests = async () => {
    if (!account || !isContractReady) return;

    try {
      const requests = await getAllAccessRequests(account);
      setAllAccessRequests(requests);
    } catch (error) {
      console.error('Failed to load access requests:', error);
    }
  };
  const handleGrantAccess = async (evidenceId: number, userAddress: string) => {
    try {
      await grantAccess(evidenceId, userAddress);
      await loadUserEvidences(); // Refresh data
      await loadAllAccessRequests();
    } catch (error) {
      console.error('Failed to grant access:', error);
    }
  };

  const handleDenyAccess = async (evidenceId: number, userAddress: string) => {
    try {
      await denyAccess(evidenceId, userAddress);
      await loadUserEvidences(); // Refresh data
      await loadAllAccessRequests();
    } catch (error) {
      console.error('Failed to deny access:', error);
    }
  };
  const handleRevokeAccess = async (evidenceId: number, userAddress: string) => {
    try {
      await revokeAccess(evidenceId, userAddress);
      await loadUserEvidences(); // Refresh data
      await loadAllAccessRequests();
    } catch (error) {
      console.error('Failed to revoke access:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredRequests = (evidence: Evidence) => {
    const allRequests = [
      ...(evidence.accessRequests || []).map(req => ({ ...req, type: 'request' })),
      ...(evidence.grantedAccess || []).map(access => ({ 
        address: access.address, 
        timestamp: access.grantedAt, 
        status: 'approved' as const,
        type: 'granted'
      }))
    ];

    let filtered = allRequests;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    return filtered;
  };

  const getPendingRequestsCount = () => {
    return allAccessRequests.filter(req => req.status === 'pending').length;
  };
  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to manage access permissions</p>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading access control data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Access Control</h2>
        </div>
<button
  onClick={() => {
    loadUserEvidences();
    loadAllAccessRequests();
  }}
  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
>
  Refresh
</button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'manage'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manage Access</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Access Requests</span>
          {getPendingRequestsCount() > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {getPendingRequestsCount()}
            </span>
          )}
        </button>
      </div>
      {activeTab === 'manage' ? (
        evidences.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Evidence Found</h3>
          <p className="text-gray-500">Submit evidence first to manage access permissions</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Evidence List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Your Evidence</h3>
            <div className="space-y-3">
              {evidences.map((evidence) => (
                <div
                  key={evidence.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEvidence === evidence.id
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedEvidence(evidence.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Evidence #{evidence.id}</h4>
                    <div className="flex items-center space-x-2">
                      {(evidence.accessRequests?.filter(req => req.status === 'pending').length || 0) > 0 && (
                        <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                          {evidence.accessRequests?.filter(req => req.status === 'pending').length} pending
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        {evidence.grantedAccess?.length || 0} granted
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{evidence.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Access Management */}
          <div className="space-y-4">
            {selectedEvidence ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">
                    Manage Access - Evidence #{selectedEvidence}
                  </h3>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by address..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="denied">Denied</option>
                  </select>
                </div>

                {/* Access Requests and Granted Access */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-4 border-b border-gray-700">
                    <h4 className="font-medium text-white">Access Management</h4>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {(() => {
                      const selectedEvidenceData = evidences.find(e => e.id === selectedEvidence);
                      const filteredRequests = selectedEvidenceData ? getFilteredRequests(selectedEvidenceData) : [];
                      
                      if (filteredRequests.length === 0) {
                        return (
                          <div className="p-6 text-center">
                            <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400">No access requests found</p>
                          </div>
                        );
                      }

                      return filteredRequests.map((item, index) => (
                        <div key={`${item.address}-${index}`} className="p-4 border-b border-gray-700 last:border-b-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${
                                item.status === 'approved' ? 'bg-green-600' :
                                item.status === 'pending' ? 'bg-yellow-600' : 
                                item.status === 'denied' ? 'bg-red-600' : 'bg-gray-600'
                              }`}>
                                {item.status === 'approved' ? (
                                  <UserPlus className="h-4 w-4 text-white" />
                                ) : item.status === 'pending' ? (
                                  <Clock className="h-4 w-4 text-white" />
                                ) : (
                                  <X className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium">{formatAddress(item.address)}</p>
                                <p className="text-gray-400 text-sm">{formatDate(item.timestamp)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.status === 'approved' ? 'bg-green-600 text-white' :
                                item.status === 'pending' ? 'bg-yellow-600 text-white' : 
                                item.status === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                              }`}>
                                {item.status}
                              </span>
                              
                              {item.status === 'pending' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleGrantAccess(selectedEvidence, item.address)}
                                    disabled={isLoading}
                                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDenyAccess(selectedEvidence, item.address)}
                                    disabled={isLoading}
                                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              
                              {item.status === 'approved' && (
                                <button
                                  onClick={() => handleRevokeAccess(selectedEvidence, item.address)}
                                  disabled={isLoading}
                                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Select Evidence</h3>
                <p className="text-gray-500">Choose an evidence item to manage access permissions</p>
              </div>
            )}
          </div>
        </div>
        )
      ) : (
        /* Access Requests Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Incoming Access Requests</h3>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">
                {allAccessRequests.filter(req => req.status === 'pending').length} pending requests
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
          </div>

          {allAccessRequests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Access Requests</h3>
              <p className="text-gray-500">You haven't received any access requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allAccessRequests
                .filter(req => filterStatus === 'all' || req.status === filterStatus)
                .sort((a, b) => {
                  // Sort pending requests first
                  if (a.status === 'pending' && b.status !== 'pending') return -1;
                  if (b.status === 'pending' && a.status !== 'pending') return 1;
                  return b.timestamp - a.timestamp;
                })
                .map((request) => (
                <div key={request.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        request.status === 'approved' ? 'bg-green-600' :
                        request.status === 'pending' ? 'bg-yellow-600' : 
                        request.status === 'denied' ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {request.status === 'approved' ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : request.status === 'pending' ? (
                          <Clock className="h-4 w-4 text-white" />
                        ) : (
                          <X className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-white font-medium">{formatAddress(request.address)}</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'approved' ? 'bg-green-600 text-white' :
                            request.status === 'pending' ? 'bg-yellow-600 text-white' : 
                            request.status === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Requesting access to Evidence #{request.evidenceId}
                        </p>
                        {request.evidenceDescription && (
                          <p className="text-gray-300 text-sm mb-2">
                          "{request.evidenceDescription}"
                          </p>
                        )}
                        <p className="text-gray-500 text-xs">
                          {formatDate(request.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGrantAccess(request.evidenceId!, request.address)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDenyAccess(request.evidenceId!, request.address)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};