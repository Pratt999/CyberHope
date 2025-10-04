import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import EvidenceStorageABI from '../contracts/EvidenceStorage.json';

// For development, we'll use a mock contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890';

export const useContract = () => {
  const { provider, signer, isConnected } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isContractReady, setIsContractReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsContractReady(false);
    if (provider && signer && isConnected) {
      try {
        // For demo purposes, we'll simulate contract connection
        setContract({ address: CONTRACT_ADDRESS } as any);
        setIsContractReady(true);
        setError(null);
      } catch (err: any) {
        console.error('Contract initialization failed:', err);
        setError('Failed to initialize contract');
        setIsContractReady(false);
      }
    } else {
      setContract(null);
      setIsContractReady(false);
    }
  }, [provider, signer, isConnected]);

  const getNextEvidenceId = () => {
    const stored = localStorage.getItem('globalEvidenceCounter') || '0';
    const counter = parseInt(stored) + 1;
    localStorage.setItem('globalEvidenceCounter', counter.toString());
    return counter;
  };

  // Global evidence storage that simulates blockchain storage
  const getGlobalEvidenceData = () => {
    const stored = localStorage.getItem('globalEvidenceData') || '[]';
    return JSON.parse(stored);
  };

  const setGlobalEvidenceData = (data: any[]) => {
    localStorage.setItem('globalEvidenceData', JSON.stringify(data));
  };
  const submitEvidence = async (ipfsHash: string, encryptedKey: string, description: string) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    
    setIsLoading(true);
    setError(null);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const evidenceId = getNextEvidenceId();
      const userAddress = await signer.getAddress();
      
      const newEvidence = {
        id: evidenceId,
        victim: userAddress,
        ipfsHash,
        encryptedKey,
        timestamp: Math.floor(Date.now() / 1000),
        description,
        isActive: true,
        hasAccess: true,
        hasRequested: false,
        accessRequests: []
      };
      
      // Store in localStorage for persistence
      const evidenceData = getGlobalEvidenceData();
      evidenceData.push(newEvidence);
      setGlobalEvidenceData(evidenceData);

      setIsLoading(false);
      return { success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}`, evidenceId };
    } catch (err: any) {
      console.error('Submit evidence failed:', err);
      setError(err.message || 'Failed to submit evidence');
      setIsLoading(false);
      throw err;
    }
  };

  const getEvidence = async (evidenceId: number) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');

    try {
      const evidenceData = getGlobalEvidenceData();
      const evidence = evidenceData.find((e: any) => e.id === evidenceId);
      
      if (!evidence) {
        throw new Error('Evidence not found');
      }
      
      // Check if current user has access
      const userAddress = await signer.getAddress();
      const hasAccess = evidence.victim.toLowerCase() === userAddress.toLowerCase() || 
                       (evidence.grantedAccess && evidence.grantedAccess.some((access: any) => 
                         access.address.toLowerCase() === userAddress.toLowerCase()));
      
      const hasRequested = evidence.accessRequests && evidence.accessRequests.some((req: any) => 
        req.address.toLowerCase() === userAddress.toLowerCase());
      
      return {
        ...evidence,
        hasAccess,
        hasRequested
      };
    } catch (err: any) {
      console.error('Get evidence failed:', err);
      throw err;
    }
  };

  const getUserEvidences = async (userAddress: string) => {
    if (!isContractReady || !contract) throw new Error('Contract not initialized');

    try {
      const evidenceData = getGlobalEvidenceData();
      return evidenceData
        .filter((e: any) => e.victim.toLowerCase() === userAddress.toLowerCase())
        .map((e: any) => e.id);
    } catch (err: any) {
      console.error('Get user evidences failed:', err);
      throw err;
    }
  };

  const requestAccess = async (evidenceId: number) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userAddress = await signer.getAddress();
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex((e: any) => e.id === evidenceId);
      
      if (evidenceIndex !== -1) {
        if (!evidenceData[evidenceIndex].accessRequests) {
          evidenceData[evidenceIndex].accessRequests = [];
        }
        
        // Check if already requested
        const alreadyRequested = evidenceData[evidenceIndex].accessRequests.some(
          (req: any) => req.address.toLowerCase() === userAddress.toLowerCase()
        );
        
        if (!alreadyRequested) {
        evidenceData[evidenceIndex].accessRequests.push({
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          address: userAddress,
          timestamp: Date.now(),
          status: 'pending'
        });
        localStorage.setItem('evidenceData', JSON.stringify(evidenceData));
        }
      }
      
        setGlobalEvidenceData(evidenceData);
      return { success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}` };
    } catch (err: any) {
      console.error('Request access failed:', err);
      setError(err.message || 'Failed to request access');
      setIsLoading(false);
      throw err;
    }
  };

  const grantAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex((e: any) => e.id === evidenceId);
      
      if (evidenceIndex !== -1) {
        if (!evidenceData[evidenceIndex].grantedAccess) {
          evidenceData[evidenceIndex].grantedAccess = [];
        }
        evidenceData[evidenceIndex].grantedAccess.push({
          address: userAddress,
          grantedAt: Date.now()
        });
        
        // Update request status
        if (evidenceData[evidenceIndex].accessRequests) {
          const requestIndex = evidenceData[evidenceIndex].accessRequests.findIndex(
            (req: any) => req.address.toLowerCase() === userAddress.toLowerCase()
          );
          if (requestIndex !== -1) {
            evidenceData[evidenceIndex].accessRequests[requestIndex].status = 'approved';
          }
        }
        
        setGlobalEvidenceData(evidenceData);
      }
      
      setIsLoading(false);
      return { success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}` };
    } catch (err: any) {
      console.error('Grant access failed:', err);
      setError(err.message || 'Failed to grant access');
      setIsLoading(false);
      throw err;
    }
  };

  const denyAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex((e: any) => e.id === evidenceId);
      
      if (evidenceIndex !== -1 && evidenceData[evidenceIndex].accessRequests) {
        const requestIndex = evidenceData[evidenceIndex].accessRequests.findIndex(
          (req: any) => req.address.toLowerCase() === userAddress.toLowerCase()
        );
        if (requestIndex !== -1) {
          evidenceData[evidenceIndex].accessRequests[requestIndex].status = 'denied';
        }
        setGlobalEvidenceData(evidenceData);
      }
      
      setIsLoading(false);
      return { success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}` };
    } catch (err: any) {
      console.error('Deny access failed:', err);
      setError(err.message || 'Failed to deny access');
      setIsLoading(false);
      throw err;
    }
  };
  const revokeAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex((e: any) => e.id === evidenceId);
      
      if (evidenceIndex !== -1 && evidenceData[evidenceIndex].grantedAccess) {
        evidenceData[evidenceIndex].grantedAccess = evidenceData[evidenceIndex].grantedAccess.filter(
          (access: any) => access.address.toLowerCase() !== userAddress.toLowerCase()
        );
        setGlobalEvidenceData(evidenceData);
      }
      
      setIsLoading(false);
      return { success: true, txHash: `0x${Math.random().toString(16).substr(2, 64)}` };
    } catch (err: any) {
      console.error('Revoke access failed:', err);
      setError(err.message || 'Failed to revoke access');
      setIsLoading(false);
      throw err;
    }
  };

  const getPermissionRequests = async (evidenceId: number) => {
    if (!isContractReady || !contract) throw new Error('Contract not initialized');

    try {
      const evidenceData = getGlobalEvidenceData();
      const evidence = evidenceData.find((e: any) => e.id === evidenceId);
      const requests = evidence?.accessRequests || [];
      
      // Return requests with proper structure
      return requests.map((req: any) => ({
        ...req,
        address: req.address,
        timestamp: req.timestamp,
        status: req.status || 'pending'
      }));
    } catch (err: any) {
      console.error('Get permission requests failed:', err);
      throw err;
    }
  };

  const getAllAccessRequests = async (userAddress: string) => {
    try {
      const evidenceData = getGlobalEvidenceData();
      
      const userEvidences = evidenceData.filter((e: any) => 
        e.victim.toLowerCase() === userAddress.toLowerCase()
      );
      
      const allRequests: any[] = [];
      userEvidences.forEach((evidence: any) => {
        if (evidence.accessRequests) {
          evidence.accessRequests.forEach((request: any) => {
            allRequests.push({
              ...request,
              evidenceId: evidence.id,
              evidenceDescription: evidence.description
            });
          });
        }
      });
      
      return allRequests.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err: any) {
      console.error('Get all access requests failed:', err);
      return [];
    }
  };

  const hasAccessPermission = async (evidenceId: number, userAddress: string) => {
    try {
      const evidenceData = getGlobalEvidenceData();
      const evidence = evidenceData.find((e: any) => e.id === evidenceId);
      
      if (!evidence) return false;
      
      // Check if user is the victim
      if (evidence.victim.toLowerCase() === userAddress.toLowerCase()) {
        return true;
      }
      
      // Check if user has been granted access
      return evidence.grantedAccess?.some((access: any) => 
        access.address.toLowerCase() === userAddress.toLowerCase()
      ) || false;
    } catch (error) {
      console.error('Check access permission failed:', error);
      return false;
    }
  };

  return {
    contract,
    isContractReady,
    isLoading,
    error,
    submitEvidence,
    getEvidence,
    getUserEvidences,
    requestAccess,
    grantAccess,
    denyAccess,
    revokeAccess,
    getPermissionRequests,
    getAllAccessRequests,
    hasAccessPermission,
  };
};