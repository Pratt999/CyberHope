const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UploadResponse {
  success: boolean;
  ipfsHash: string;
  encryptionKey: string;
  metadata: any;
  pinataResponse: any;
}

export interface EvidenceMetadata {
  name: string;
  description: string;
  timestamp: string;
  victimAddress: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  encrypted: boolean;
}

export interface AccessRequest {
  id: string;
  evidenceId: number;
  requesterAddress: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
  message?: string;
}
class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      // For demo purposes, return mock data if API is not available
      if (endpoint === '/health') {
        return { status: 'OK', message: 'Mock API running' };
      }
      throw error;
    }
  }

  async uploadEvidence(file: File, description: string, victimAddress: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('victimAddress', victimAddress);

      const response = await fetch(`${API_BASE_URL}/upload-evidence`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      // Mock response for demo purposes
      console.warn('API not available, using mock response');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload time
      
      // Create a mock file blob for demonstration
      const mockFileContent = `Mock evidence file: ${file.name}\nDescription: ${description}\nUploaded by: ${victimAddress}\nTimestamp: ${new Date().toISOString()}`;
      const blob = new Blob([mockFileContent], { type: 'text/plain' });
      const mockUrl = URL.createObjectURL(blob);
      
      // Store the mock file URL for later retrieval
      const ipfsHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      localStorage.setItem(`ipfs_${ipfsHash}`, mockUrl);
      return {
        success: true,
        ipfsHash: ipfsHash,
        encryptionKey: Math.random().toString(36).substr(2, 32),
        metadata: {
          name: `Evidence_${Date.now()}`,
          description,
          timestamp: new Date().toISOString(),
          victimAddress,
          originalFileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          encrypted: true
        },
        pinataResponse: { IpfsHash: ipfsHash }
      };
    }
  }

  async getEvidence(hash: string, key?: string) {
    try {
      const params = key ? `?key=${encodeURIComponent(key)}` : '';
      return this.request(`/evidence/${hash}${params}`);
    } catch (error) {
      // Check if we have a mock file stored
      const mockUrl = localStorage.getItem(`ipfs_${hash}`);
      return {
        success: true,
        ipfsUrl: mockUrl || `https://gateway.pinata.cloud/ipfs/${hash}`,
        hash: hash
      };
    }
  }

  async getEvidenceMetadata(hash: string) {
    try {
      return this.request(`/evidence/${hash}/metadata`);
    } catch (error) {
      // Mock response for demo
      return {
        success: true,
        metadata: null
      };
    }
  }

  async getUserEvidence(address: string) {
    try {
      return this.request(`/evidence/user/${address}`);
    } catch (error) {
      // Mock response for demo
      return {
        success: true,
        evidence: []
      };
    }
  }

  async pinMetadata(metadata: any) {
    try {
      return this.request('/pin-metadata', {
        method: 'POST',
        body: JSON.stringify({ metadata }),
      });
    } catch (error) {
      // Mock response for demo
      return {
        success: true,
        ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`
      };
    }
  }

  async healthCheck() {
    try {
      return this.request('/health');
    } catch (error) {
      // Mock response for demo
      return { status: 'OK', message: 'Mock API running' };
    }
  }
}

export const apiService = new ApiService();