# SecureEvidence - Blockchain Cyberbullying Evidence Storage

A decentralized application for securely storing and managing cyberbullying evidence using blockchain technology, IPFS, and end-to-end encryption.

## Features

- **Blockchain Security**: Evidence metadata stored immutably on Ethereum
- **IPFS Storage**: Files encrypted and distributed via IPFS using Pinata
- **MetaMask Integration**: Secure wallet-based authentication
- **Access Control**: Victim-controlled permission system
- **End-to-End Encryption**: Files encrypted before upload
- **Responsive Design**: Modern, accessible interface

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Ethers.js for blockchain interaction
- Lucide React for icons

### Backend
- Node.js with Express
- Pinata SDK for IPFS integration
- Multer for file handling
- Crypto for encryption

### Blockchain
- Ethereum smart contract
- Solidity 0.8.19
- MetaMask for wallet connection

## Setup Instructions

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MetaMask** browser extension
3. **Pinata Account** for IPFS storage
4. **Ethereum Development Network** (Ganache, Hardhat, or testnet)

### Backend Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

2. **Configure Pinata**
   - Sign up at [Pinata.cloud](https://pinata.cloud)
   - Get your API Key and Secret API Key
   - Update `.env` file:
   ```
   PINATA_API_KEY=your_pinata_api_key_here
   PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here
   PORT=5000
   ```

3. **Start Backend Server**
   ```bash
   npm run server
   ```

### Smart Contract Deployment

1. **Install Hardhat** (optional, for local development)
   ```bash
   npm install -g hardhat
   ```

2. **Deploy Contract**
   - Use Remix IDE: https://remix.ethereum.org/
   - Copy contract from `contracts/EvidenceStorage.sol`
   - Deploy to your preferred network
   - Update `VITE_CONTRACT_ADDRESS` in `.env`

3. **Update Frontend Configuration**
   ```
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address
   VITE_NETWORK_ID=your_network_chain_id
   VITE_API_URL=http://localhost:5000/api
   ```

### Frontend Setup

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Connect MetaMask**
   - Install MetaMask extension
   - Create or import wallet
   - Connect to your development network
   - Ensure you have test ETH for transactions

## Usage Guide

### For Victims (Evidence Submitters)

1. **Connect Wallet**
   - Click "Connect MetaMask" in the header
   - Approve connection in MetaMask

2. **Submit Evidence**
   - Navigate to "Submit Evidence" tab
   - Select file (max 10MB)
   - Provide detailed description
   - Click "Submit Evidence"
   - Confirm blockchain transaction

3. **Manage Evidence**
   - View submitted evidence in "My Evidence" tab
   - Each evidence has a unique blockchain ID
   - Files are encrypted and stored on IPFS

4. **Control Access**
   - Grant/revoke access to authorized users
   - All access changes are recorded on blockchain

### For Authorized Users (Law Enforcement, Legal)

1. **Request Access**
   - Connect wallet
   - Enter evidence ID
   - Submit access request
   - Wait for victim approval

2. **View Evidence**
   - Once approved, access evidence files
   - All access attempts are logged
   - Evidence cannot be modified

## Security Features

### Encryption
- Files encrypted with AES-256-GCM before upload
- Encryption keys stored on blockchain
- Only authorized users can decrypt

### Blockchain Immutability
- Evidence metadata cannot be altered
- All transactions permanently recorded
- Transparent audit trail

### Access Control
- Victim has complete control over permissions
- Permission changes require blockchain transactions
- Access requests are traceable

### Privacy Protection
- File contents never exposed publicly
- IPFS hashes don't reveal file content
- Encryption ensures data privacy

## API Endpoints

### Evidence Management
- `POST /api/upload-evidence` - Upload encrypted evidence
- `GET /api/evidence/:hash` - Retrieve evidence file
- `GET /api/evidence/:hash/metadata` - Get evidence metadata
- `GET /api/evidence/user/:address` - List user's evidence

### System
- `GET /api/health` - Server health check
- `POST /api/pin-metadata` - Pin additional metadata

## Smart Contract Functions

### Evidence Submission
- `submitEvidence()` - Store evidence on blockchain
- `getEvidence()` - Retrieve evidence details
- `getUserEvidences()` - Get user's evidence list

### Access Control
- `requestAccess()` - Request evidence access
- `grantAccess()` - Grant user access
- `revokeAccess()` - Revoke user access
- `getPermissionRequests()` - View pending requests

## Development Notes

### File Structure
```
src/
├── components/          # React components
├── contracts/          # Smart contract ABI
├── hooks/             # Custom React hooks
├── services/          # API service layer
├── types/             # TypeScript definitions
└── App.tsx           # Main application

server/
└── server.js         # Express backend

contracts/
└── EvidenceStorage.sol # Solidity smart contract
```

### Key Components
- `WalletConnect`: MetaMask integration
- `EvidenceUpload`: File upload and submission
- `EvidenceList`: Display user's evidence
- `useWallet`: Wallet state management
- `useContract`: Smart contract interaction

## Security Considerations

1. **Private Keys**: Never commit private keys or sensitive data
2. **Network Security**: Use HTTPS in production
3. **Input Validation**: All inputs are validated client and server-side
4. **File Types**: Restrict allowed file types for security
5. **Rate Limiting**: Implement API rate limiting in production
6. **IPFS Pinning**: Ensure evidence remains available via pinning

## Production Deployment

### Backend
- Use environment variables for all configuration
- Implement proper logging and monitoring
- Set up SSL/TLS certificates
- Configure firewall and security groups

### Frontend
- Build optimized production bundle
- Configure CDN for static assets
- Set up monitoring and analytics

### Smart Contract
- Deploy to mainnet or appropriate testnet
- Verify contract source code on Etherscan
- Set up event monitoring

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with detailed description

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For technical support or questions:
- Create an issue on GitHub
- Review documentation
- Check existing solutions in issues

## Disclaimer

This software is provided as-is for educational and development purposes. Users are responsible for ensuring compliance with local laws and regulations regarding evidence handling and privacy.