import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import contractABI from '../abi/DigitalEvidenceWallet.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''; // from .env

export const useContract = () => {
  const { provider, account, isConnected } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        setError(null);

        if (!isConnected || !provider) {
          setContract(null);
          return;
        }

        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        setContract(connectedContract);
      } catch (err: any) {
        console.error('Contract init failed:', err);
        setError('Failed to connect to contract.');
      }
    };

    initContract();
  }, [provider, isConnected]);

  // Upload evidence (store hash and metadata)
  const uploadEvidence = async (hash: string, metadata: string) => {
    if (!contract) throw new Error('Contract not connected.');
    const tx = await contract.storeEvidence(hash, metadata);
    await tx.wait();
    return tx;
  };

  // Request access for a particular user
  const requestAccess = async (targetAddress: string) => {
    if (!contract) throw new Error('Contract not connected.');
    const tx = await contract.requestAccess(targetAddress);
    await tx.wait();
    return tx;
  };

  // Get all evidence owned by the connected account
  const getMyEvidence = async () => {
    if (!contract || !account) throw new Error('Contract not connected.');
    const evidenceList = await contract.getEvidenceByOwner(account);
    return evidenceList;
  };

  // Check if current user has access to a particular evidence hash
  const hasAccess = async (hash: string) => {
    if (!contract || !account) throw new Error('Contract not connected.');
    const access = await contract.hasAccess(account, hash);
    return access;
  };

  return {
    contract,
    error,
    uploadEvidence,
    requestAccess,
    getMyEvidence,
    hasAccess
  };
};
