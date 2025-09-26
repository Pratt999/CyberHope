// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EvidenceStorage {
    struct Evidence {
        uint256 id;
        address victim;
        string ipfsHash;
        string encryptedKey;
        uint256 timestamp;
        string description;
        bool isActive;
        mapping(address => bool) accessPermissions;
        address[] permissionRequests;
        mapping(address => bool) hasRequested;
    }
    
    struct EvidenceView {
        uint256 id;
        address victim;
        string ipfsHash;
        string encryptedKey;
        uint256 timestamp;
        string description;
        bool isActive;
        bool hasAccess;
        bool hasRequested;
    }
    
    mapping(uint256 => Evidence) private evidences;
    mapping(address => uint256[]) private userEvidences;
    uint256 private evidenceCounter;
    
    event EvidenceSubmitted(uint256 indexed evidenceId, address indexed victim, string ipfsHash);
    event AccessRequested(uint256 indexed evidenceId, address indexed requester);
    event AccessGranted(uint256 indexed evidenceId, address indexed requester);
    event AccessRevoked(uint256 indexed evidenceId, address indexed user);
    
    modifier onlyVictim(uint256 evidenceId) {
        require(evidences[evidenceId].victim == msg.sender, "Only victim can perform this action");
        _;
    }
    
    modifier evidenceExists(uint256 evidenceId) {
        require(evidences[evidenceId].victim != address(0), "Evidence does not exist");
        _;
    }
    
    function submitEvidence(
        string memory ipfsHash,
        string memory encryptedKey,
        string memory description
    ) external returns (uint256) {
        evidenceCounter++;
        uint256 evidenceId = evidenceCounter;
        
        Evidence storage newEvidence = evidences[evidenceId];
        newEvidence.id = evidenceId;
        newEvidence.victim = msg.sender;
        newEvidence.ipfsHash = ipfsHash;
        newEvidence.encryptedKey = encryptedKey;
        newEvidence.timestamp = block.timestamp;
        newEvidence.description = description;
        newEvidence.isActive = true;
        
        userEvidences[msg.sender].push(evidenceId);
        
        emit EvidenceSubmitted(evidenceId, msg.sender, ipfsHash);
        return evidenceId;
    }
    
    function requestAccess(uint256 evidenceId) external evidenceExists(evidenceId) {
        require(evidences[evidenceId].victim != msg.sender, "Victims already have access");
        require(!evidences[evidenceId].hasRequested[msg.sender], "Access already requested");
        require(!evidences[evidenceId].accessPermissions[msg.sender], "Access already granted");
        
        evidences[evidenceId].permissionRequests.push(msg.sender);
        evidences[evidenceId].hasRequested[msg.sender] = true;
        
        emit AccessRequested(evidenceId, msg.sender);
    }
    
    function grantAccess(uint256 evidenceId, address user) 
        external 
        onlyVictim(evidenceId) 
        evidenceExists(evidenceId) 
    {
        evidences[evidenceId].accessPermissions[user] = true;
        emit AccessGranted(evidenceId, user);
    }
    
    function revokeAccess(uint256 evidenceId, address user) 
        external 
        onlyVictim(evidenceId) 
        evidenceExists(evidenceId) 
    {
        evidences[evidenceId].accessPermissions[user] = false;
        emit AccessRevoked(evidenceId, user);
    }
    
    function getEvidence(uint256 evidenceId) 
        external 
        view 
        evidenceExists(evidenceId) 
        returns (EvidenceView memory) 
    {
        Evidence storage evidence = evidences[evidenceId];
        bool hasAccess = evidence.victim == msg.sender || evidence.accessPermissions[msg.sender];
        bool hasRequested = evidence.hasRequested[msg.sender];
        
        return EvidenceView({
            id: evidence.id,
            victim: evidence.victim,
            ipfsHash: hasAccess ? evidence.ipfsHash : "",
            encryptedKey: hasAccess ? evidence.encryptedKey : "",
            timestamp: evidence.timestamp,
            description: evidence.description,
            isActive: evidence.isActive,
            hasAccess: hasAccess,
            hasRequested: hasRequested
        });
    }
    
    function getUserEvidences(address user) external view returns (uint256[] memory) {
        return userEvidences[user];
    }
    
    function getPermissionRequests(uint256 evidenceId) 
        external 
        view 
        onlyVictim(evidenceId) 
        evidenceExists(evidenceId) 
        returns (address[] memory) 
    {
        return evidences[evidenceId].permissionRequests;
    }
    
    function hasAccessPermission(uint256 evidenceId, address user) 
        external 
        view 
        evidenceExists(evidenceId) 
        returns (bool) 
    {
        return evidences[evidenceId].victim == user || evidences[evidenceId].accessPermissions[user];
    }
}