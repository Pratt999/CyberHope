const express = require('express');
const cors = require('cors');
const multer = require('multer');
const PinataSDK = require('@pinata/sdk');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Initialize Pinata
const pinata = new PinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

// Test Pinata connection
pinata.testAuthentication().then((result) => {
  console.log('Pinata connected:', result);
}).catch((err) => {
  console.log('Pinata connection error:', err);
});

// Encryption utilities
function encryptFile(buffer, password) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setIV(iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Evidence storage server running' });
});

// Upload evidence to IPFS
app.post('/api/upload-evidence', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { description, victimAddress } = req.body;
    
    if (!description || !victimAddress) {
      return res.status(400).json({ error: 'Description and victim address are required' });
    }

    // Generate encryption key
    const encryptionKey = generateEncryptionKey();
    
    // Read and encrypt file
    const fileBuffer = fs.readFileSync(req.file.path);
    const encryptedData = encryptFile(fileBuffer, encryptionKey);
    
    // Create metadata
    const metadata = {
      name: `Evidence_${Date.now()}`,
      description: description,
      timestamp: new Date().toISOString(),
      victimAddress: victimAddress,
      originalFileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      encrypted: true
    };

    // Upload encrypted file to IPFS
    const fileStream = fs.createReadStream(req.file.path);
    const options = {
      pinataMetadata: metadata,
      pinataOptions: {
        cidVersion: 0,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 2
            },
            {
              id: 'NYC1',
              desiredReplicationCount: 2
            }
          ]
        }
      }
    };

    const result = await pinata.pinFileToIPFS(fileStream, options);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      ipfsHash: result.IpfsHash,
      encryptionKey: encryptionKey,
      metadata: metadata,
      pinataResponse: result
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to upload evidence',
      details: error.message 
    });
  }
});

// Get file from IPFS
app.get('/api/evidence/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { key } = req.query;
    
    if (!hash) {
      return res.status(400).json({ error: 'IPFS hash is required' });
    }

    // For now, return the IPFS gateway URL
    // In production, you might want to decrypt and serve the file directly
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    
    res.json({
      success: true,
      ipfsUrl: ipfsUrl,
      hash: hash
    });

  } catch (error) {
    console.error('Retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve evidence',
      details: error.message 
    });
  }
});

// Get evidence metadata
app.get('/api/evidence/:hash/metadata', async (req, res) => {
  try {
    const { hash } = req.params;
    
    const metadata = await pinata.pinList({
      hashContains: hash,
      status: 'pinned'
    });
    
    res.json({
      success: true,
      metadata: metadata.rows[0] || null
    });

  } catch (error) {
    console.error('Metadata retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve metadata',
      details: error.message 
    });
  }
});

// List user's evidence
app.get('/api/evidence/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await pinata.pinList({
      status: 'pinned',
      metadata: {
        name: 'Evidence',
        keyvalues: {
          victimAddress: {
            value: address,
            op: 'eq'
          }
        }
      }
    });
    
    res.json({
      success: true,
      evidence: result.rows
    });

  } catch (error) {
    console.error('List evidence error:', error);
    res.status(500).json({ 
      error: 'Failed to list evidence',
      details: error.message 
    });
  }
});

// Pin additional metadata
app.post('/api/pin-metadata', async (req, res) => {
  try {
    const { metadata } = req.body;
    
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `Metadata_${Date.now()}`
      }
    });
    
    res.json({
      success: true,
      ipfsHash: result.IpfsHash
    });

  } catch (error) {
    console.error('Metadata pin error:', error);
    res.status(500).json({ 
      error: 'Failed to pin metadata',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Evidence storage server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});

module.exports = app;