import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import EvidenceStorageABI from '../contracts/EvidenceStorage.json';

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
        setContract({ address: CONTRACT_ADDRESS } as any); // Simulated contract
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        grantedAccess: []
      };

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
      if (!evidence) throw new Error('Evidence not found');

      const userAddress = await signer.getAddress();
      const hasAccess = evidence.victim.toLowerCase() === userAddress.toLowerCase() ||
        (evidence.grantedAccess?.some((acc: any) => acc.address.toLowerCase() === userAddress.toLowerCase()) ?? false);
      const hasRequested = evidence.accessRequests?.some((req: any) => req.address.toLowerCase() === userAddress.toLowerCase()) ?? false;

      return { ...evidence, hasAccess, hasRequested };
    } catch (err: any) {
      console.error('Get evidence failed:', err);
      throw err;
    }
  };

  const getUserEvidences = async (userAddress: string) => {
    const evidenceData = getGlobalEvidenceData();
    return evidenceData.filter((e: any) => e.victim.toLowerCase() === userAddress.toLowerCase()).map((e: any) => e.id);
  };

  const requestAccess = async (evidenceId: number) => {
    if (!isContractReady || !contract || !signer) throw new Error('Contract not initialized');
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userAddress = await signer.getAddress();
      const evidenceData = getGlobalEvidenceData();
      const idx = evidenceData.findIndex((e: any) => e.id === evidenceId);

      if (idx !== -1) {
        evidenceData[idx].accessRequests ??= [];
        const alreadyRequested = evidenceData[idx].accessRequests.some((r: any) => r.address.toLowerCase() === userAddress.toLowerCase());
        if (!alreadyRequested) {
          evidenceData[idx].accessRequests.push({
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            address: userAddress,
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      }

      setGlobalEvidenceData(evidenceData);
      setIsLoading(false);
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
      await new Promise(resolve => setTimeout(resolve, 500));
      const evidenceData = getGlobalEvidenceData();
      const idx = evidenceData.findIndex((e: any) => e.id === evidenceId);
      if (idx !== -1) {
        evidenceData[idx].grantedAccess ??= [];
        if (!evidenceData[idx].grantedAccess.some((acc: any) => acc.address.toLowerCase() === userAddress.toLowerCase())) {
          evidenceData[idx].grantedAccess.push({ address: userAddress, grantedAt: Date.now() });
        }
        evidenceData[idx].accessRequests?.forEach((req: any) => {
          if (req.address.toLowerCase() === userAddress.toLowerCase()) req.status = 'approved';
        });
      }
      setGlobalEvidenceData(evidenceData);
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
    const evidenceData = getGlobalEvidenceData();
    const idx = evidenceData.findIndex((e: any) => e.id === evidenceId);
    if (idx !== -1 && evidenceData[idx].accessRequests) {
      evidenceData[idx].accessRequests.forEach((req: any) => {
        if (req.address.toLowerCase() === userAddress.toLowerCase()) req.status = 'denied';
      });
      setGlobalEvidenceData(evidenceData);
    }
  };

  const revokeAccess = async (evidenceId: number, userAddress: string) => {
    const evidenceData = getGlobalEvidenceData();
    const idx = evidenceData.findIndex((e: any) => e.id === evidenceId);
    if (idx !== -1 && evidenceData[idx].grantedAccess) {
      evidenceData[idx].grantedAccess = evidenceData[idx].grantedAccess.filter(
        (acc: any) => acc.address.toLowerCase() !== userAddress.toLowerCase()
      );
      setGlobalEvidenceData(evidenceData);
    }
  };

  const getPermissionRequests = async (evidenceId: number) => {
    const evidence = getGlobalEvidenceData().find((e: any) => e.id === evidenceId);
    return evidence?.accessRequests?.map((r: any) => ({
      ...r,
      status: r.status ?? 'pending'
    })) || [];
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
    getPermissionRequests
  };
};
