import React, { useState, useRef } from 'react';
import { Upload, FileText, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { apiService } from '../services/api';

export const EvidenceUpload: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { submitEvidence, isLoading: contractLoading } = useContract();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: any;
  }>({ type: null, message: '' });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          type: 'error',
          message: 'File size must be less than 10MB'
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          type: 'error',
          message: 'File size must be less than 10MB'
        });
        return;
      }
      setSelectedFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !description.trim() || !account) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file and provide a description'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Step 1: Upload to IPFS via backend
      setUploadStatus({ type: null, message: 'Encrypting and uploading to IPFS...' });
      const uploadResult = await apiService.uploadEvidence(selectedFile, description, account);
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload to IPFS');
      }

      // Step 2: Store evidence hash and key on blockchain
      setUploadStatus({ type: null, message: 'Storing evidence on blockchain...' });
      const contractResult = await submitEvidence(
        uploadResult.ipfsHash,
        uploadResult.encryptionKey,
        description
      );

      setUploadStatus({
        type: 'success',
        message: 'Evidence submitted successfully!',
        details: {
          evidenceId: contractResult.evidenceId?.toString(),
          txHash: contractResult.txHash,
          ipfsHash: uploadResult.ipfsHash
        }
      });

      // Reset form
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Evidence submission failed:', error);
      setUploadStatus({
        type: 'error',
        message: error.message || 'Failed to submit evidence'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Lock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Wallet Required</h3>
        <p className="text-gray-500">Please connect your wallet to submit evidence</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Upload className="h-6 w-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Submit Evidence</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            selectedFile 
              ? 'border-blue-500 bg-blue-900/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="h-8 w-8 text-blue-400 mx-auto" />
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-500 mx-auto" />
              <p className="text-gray-300">
                Drop your evidence file here or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  browse
                </button>
              </p>
              <p className="text-gray-500 text-sm">
                Supports images, documents, videos (max 10MB)
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Evidence Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Provide a detailed description of the evidence being submitted..."
            required
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <Lock className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-400 font-medium mb-1">Security Notice</p>
            <p className="text-blue-300">
              Your evidence will be encrypted and stored on IPFS. Only you and users you grant 
              permission to will be able to access the content.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus.type && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
            uploadStatus.type === 'success' 
              ? 'bg-green-900/20 border-green-500/30 text-green-400' 
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <div className="flex-1">
              <p className="text-sm">{uploadStatus.message}</p>
              {uploadStatus.details && (
                <div className="mt-2 text-xs space-y-1">
                  {uploadStatus.details.evidenceId && (
                    <p>Evidence ID: {uploadStatus.details.evidenceId}</p>
                  )}
                  {uploadStatus.details.ipfsHash && (
                    <p>IPFS Hash: {uploadStatus.details.ipfsHash}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center space-x-2 text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{uploadStatus.message || 'Processing...'}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || !description.trim() || isUploading || contractLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isUploading || contractLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>
            {isUploading || contractLoading ? 'Submitting...' : 'Submit Evidence'}
          </span>
        </button>
      </form>
    </div>
  );
};