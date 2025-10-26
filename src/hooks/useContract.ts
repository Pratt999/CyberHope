import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import EvidenceStorageABI from '../contracts/EvidenceStorage.json';

const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0x1234567890123456789012345678901234567890';

export const useContract = () => {
  const { provider, signer, isConnected } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isContractReady, setIsContractReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------
  // CONTRACT INITIALIZATION
  // ----------------------------
  useEffect(() => {
    setIsContractReady(false);
    if (provider && signer && isConnected) {
      try {
        // Mock contract for demo
        setContract({ address: CONTRACT_ADDRESS } as any);
        setIsContractReady(true);
        setError(null);
      } catch (err: any) {
        console.error('Contract initialization failed:', err);
        setError('Failed to initialize contract');
      }
    } else {
      setContract(null);
      setIsContractReady(false);
    }
  }, [provider, signer, isConnected]);

  // ----------------------------
  // LOCAL STORAGE HELPERS
  // ----------------------------
  const getGlobalEvidenceData = () => {
    const stored = localStorage.getItem('globalEvidenceData') || '[]';
    return JSON.parse(stored);
  };

  const setGlobalEvidenceData = (data: any[]) => {
    localStorage.setItem('globalEvidenceData', JSON.stringify(data));
  };

  const getNextEvidenceId = () => {
    const stored = localStorage.getItem('globalEvidenceCounter') || '0';
    const counter = parseInt(stored) + 1;
    localStorage.setItem('globalEvidenceCounter', counter.toString());
    return counter;
  };

  // ----------------------------
  // EVIDENCE OPERATIONS
  // ----------------------------
  const submitEvidence = async (
    ipfsHash: string,
    encryptedKey: string,
    description: string
  ) => {
    if (!isContractReady || !signer) throw new Error('Contract not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
        accessRequests: [],
        grantedAccess: [],
      };

      const evidenceData = getGlobalEvidenceData();
      evidenceData.push(newEvidence);
      setGlobalEvidenceData(evidenceData);

      setIsLoading(false);
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        evidenceId,
      };
    } catch (err: any) {
      console.error('Submit evidence failed:', err);
      setError(err.message || 'Failed to submit evidence');
      setIsLoading(false);
      throw err;
    }
  };

  const getEvidence = async (evidenceId: number) => {
    if (!isContractReady || !signer) throw new Error('Contract not initialized');

    const evidenceData = getGlobalEvidenceData();
    const evidence = evidenceData.find((e: any) => e.id === evidenceId);
    if (!evidence) throw new Error('Evidence not found');

    const userAddress = await signer.getAddress();
    const hasAccess =
      evidence.victim.toLowerCase() === userAddress.toLowerCase() ||
      (evidence.grantedAccess &&
        evidence.grantedAccess.some(
          (acc: any) =>
            acc.address.toLowerCase() === userAddress.toLowerCase()
        ));

    const hasRequested =
      evidence.accessRequests &&
      evidence.accessRequests.some(
        (req: any) => req.address.toLowerCase() === userAddress.toLowerCase()
      );

    return { ...evidence, hasAccess, hasRequested };
  };

  const getUserEvidences = async (userAddress: string) => {
    if (!isContractReady) throw new Error('Contract not initialized');
    const data = getGlobalEvidenceData();
    return data
      .filter((e: any) => e.victim.toLowerCase() === userAddress.toLowerCase())
      .map((e: any) => e.id);
  };

  // ----------------------------
  // ACCESS REQUESTS
  // ----------------------------
  const requestAccess = async (evidenceId: number) => {
    if (!isContractReady || !signer)
      throw new Error('Contract not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const userAddress = await signer.getAddress();
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex(
        (e: any) => e.id === evidenceId
      );

      if (evidenceIndex === -1)
        throw new Error('Evidence not found for access request');

      const target = evidenceData[evidenceIndex];
      target.accessRequests = target.accessRequests || [];

      const alreadyRequested = target.accessRequests.some(
        (req: any) => req.address.toLowerCase() === userAddress.toLowerCase()
      );

      if (!alreadyRequested) {
        target.accessRequests.push({
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          address: userAddress,
          timestamp: Date.now(),
          status: 'pending',
        });
      }

      setGlobalEvidenceData(evidenceData);

      setIsLoading(false);
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
    } catch (err: any) {
      console.error('Request access failed:', err);
      setError(err.message || 'Failed to request access');
      setIsLoading(false);
      throw err;
    }
  };

  const grantAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !signer)
      throw new Error('Contract not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const evidenceData = getGlobalEvidenceData();
      const evidenceIndex = evidenceData.findIndex(
        (e: any) => e.id === evidenceId
      );
      if (evidenceIndex === -1) throw new Error('Evidence not found');

      const evidence = evidenceData[evidenceIndex];
      evidence.grantedAccess = evidence.grantedAccess || [];
      evidence.grantedAccess.push({
        address: userAddress,
        grantedAt: Date.now(),
      });

      if (evidence.accessRequests) {
        const req = evidence.accessRequests.find(
          (r: any) => r.address.toLowerCase() === userAddress.toLowerCase()
        );
        if (req) req.status = 'approved';
      }

      setGlobalEvidenceData(evidenceData);
      setIsLoading(false);
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
    } catch (err: any) {
      console.error('Grant access failed:', err);
      setError(err.message || 'Failed to grant access');
      setIsLoading(false);
      throw err;
    }
  };

  const denyAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !signer)
      throw new Error('Contract not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const evidenceData = getGlobalEvidenceData();
      const evidence = evidenceData.find((e: any) => e.id === evidenceId);
      if (!evidence) throw new Error('Evidence not found');

      const req = evidence.accessRequests?.find(
        (r: any) => r.address.toLowerCase() === userAddress.toLowerCase()
      );
      if (req) req.status = 'denied';

      setGlobalEvidenceData(evidenceData);
      setIsLoading(false);
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
    } catch (err: any) {
      console.error('Deny access failed:', err);
      setError(err.message || 'Failed to deny access');
      setIsLoading(false);
      throw err;
    }
  };

  const revokeAccess = async (evidenceId: number, userAddress: string) => {
    if (!isContractReady || !signer)
      throw new Error('Contract not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const evidenceData = getGlobalEvidenceData();
      const evidence = evidenceData.find((e: any) => e.id === evidenceId);
      if (!evidence) throw new Error('Evidence not found');

      evidence.grantedAccess = evidence.grantedAccess?.filter(
        (g: any) => g.address.toLowerCase() !== userAddress.toLowerCase()
      );

      setGlobalEvidenceData(evidenceData);
      setIsLoading(false);
      return {
        success: true,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
    } catch (err: any) {
      console.error('Revoke access failed:', err);
      setError(err.message || 'Failed to revoke access');
      setIsLoading(false);
      throw err;
    }
  };

  const getPermissionRequests = async (evidenceId: number) => {
    if (!isContractReady) throw new Error('Contract not initialized');
    const evidenceData = getGlobalEvidenceData();
    const evidence = evidenceData.find((e: any) => e.id === evidenceId);
    return (
      evidence?.accessRequests?.map((req: any) => ({
        ...req,
        address: req.address,
        timestamp: req.timestamp,
        status: req.status || 'pending',
      })) || []
    );
  };

  const getAllAccessRequests = async (userAddress: string) => {
    const evidenceData = getGlobalEvidenceData();
    const ownedEvidences = evidenceData.filter(
      (e: any) => e.victim.toLowerCase() === userAddress.toLowerCase()
    );

    const allRequests: any[] = [];
    ownedEvidences.forEach((evidence: any) => {
      (evidence.accessRequests || []).forEach((req: any) =>
        allRequests.push({
          ...req,
          evidenceId: evidence.id,
          evidenceDescription: evidence.description,
        })
      );
    });

    return allRequests.sort((a, b) => b.timestamp - a.timestamp);
  };

  const hasAccessPermission = async (
    evidenceId: number,
    userAddress: string
  ) => {
    const evidenceData = getGlobalEvidenceData();
    const evidence = evidenceData.find((e: any) => e.id === evidenceId);
    if (!evidence) return false;
    if (evidence.victim.toLowerCase() === userAddress.toLowerCase()) return true;
    return (
      evidence.grantedAccess?.some(
        (a: any) => a.address.toLowerCase() === userAddress.toLowerCase()
      ) || false
    );
  };

  // ----------------------------
  // EXPORT
  // ----------------------------
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
