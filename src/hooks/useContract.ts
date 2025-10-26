import { useState } from 'react';
import { ethers } from 'ethers';
import EvidenceStorageABI from '../artifacts/contracts/EvidenceStorage.sol/EvidenceStorage.json';

// Replace with your deployed contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xYourContractAddressHere";

export const useContract = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = async () => {
    if (!(window as any).ethereum) throw new Error("MetaMask not detected");
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, EvidenceStorageABI.abi, signer);
  };

  // Submit new evidence
  const submitEvidence = async (ipfsHash: string, encryptedKey: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.submitEvidence(ipfsHash, encryptedKey, description);
      const receipt = await tx.wait();
      return receipt;
    } catch (err: any) {
      console.error("submitEvidence error:", err);
      setError(err.message || "Failed to submit evidence");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Request access to someone’s evidence
  const requestAccess = async (evidenceId: number) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.requestAccess(evidenceId);
      await tx.wait();
    } catch (err: any) {
      console.error("requestAccess error:", err);
      setError(err.message || "Access request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Victim grants access to a requester
  const grantAccess = async (evidenceId: number, user: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.grantAccess(evidenceId, user);
      await tx.wait();
    } catch (err: any) {
      console.error("grantAccess error:", err);
      setError(err.message || "Failed to grant access");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Victim rejects an access request
  const rejectAccess = async (evidenceId: number, user: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.rejectAccess(evidenceId, user);
      await tx.wait();
    } catch (err: any) {
      console.error("rejectAccess error:", err);
      setError(err.message || "Failed to reject access");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Victim revokes access from a user
  const revokeAccess = async (evidenceId: number, user: string) => {
    setLoading(true);
    setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.revokeAccess(evidenceId, user);
      await tx.wait();
    } catch (err: any) {
      console.error("revokeAccess error:", err);
      setError(err.message || "Failed to revoke access");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed evidence (returns empty strings if no permission)
  const getEvidence = async (evidenceId: number) => {
    try {
      const contract = await getContract();
      return await contract.getEvidence(evidenceId);
    } catch (err: any) {
      console.error("getEvidence error:", err);
      setError(err.message || "Failed to fetch evidence");
      throw err;
    }
  };

  // Fetch summary for listing
  const getEvidenceSummary = async (evidenceId: number) => {
    try {
      const contract = await getContract();
      return await contract.getEvidenceSummary(evidenceId);
    } catch (err: any) {
      console.error("getEvidenceSummary error:", err);
      setError(err.message || "Failed to fetch evidence summary");
      throw err;
    }
  };

  // Victim sees all access requests
  const getPermissionRequests = async (evidenceId: number) => {
    try {
      const contract = await getContract();
      return await contract.getPermissionRequests(evidenceId);
    } catch (err: any) {
      console.error("getPermissionRequests error:", err);
      setError(err.message || "Failed to fetch permission requests");
      throw err;
    }
  };

  // Victim sees who currently has access
  const getGrantedUsers = async (evidenceId: number) => {
    try {
      const contract = await getContract();
      return await contract.getGrantedUsers(evidenceId);
    } catch (err: any) {
      console.error("getGrantedUsers error:", err);
      setError(err.message || "Failed to fetch granted users");
      throw err;
    }
  };

  // User sees all evidence they submitted
  const getUserEvidences = async (address: string) => {
    try {
      const contract = await getContract();
      return await contract.getUserEvidences(address);
    } catch (err: any) {
      console.error("getUserEvidences error:", err);
      setError(err.message || "Failed to fetch user evidences");
      throw err;
    }
  };

  return {
    loading,
    error,
    submitEvidence,
    requestAccess,
    grantAccess,
    rejectAccess,
    revokeAccess,
    getEvidence,
    getEvidenceSummary,
    getPermissionRequests,
    getGrantedUsers,
    getUserEvidences
  };
};
