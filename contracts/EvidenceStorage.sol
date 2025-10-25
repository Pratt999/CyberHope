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
        mapping(address => bool) accessPermissions; // who can access
        address[] permissionRequests;               // list of who requested
        mapping(address => bool) hasRequested;      // track duplicates
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

    // Submit new evidence (victim only)
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

    // Request access to evidence (anyone except victim)
    function requestAccess(uint256 evidenceId)
        external
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];

        require(e.victim != msg.sender, "Victim already has access");
        require(!e.hasRequested[msg.sender], "Access already requested");
        require(!e.accessPermissions[msg.sender], "Access already granted");

        e.permissionRequests.push(msg.sender);
        e.hasRequested[msg.sender] = true;

        emit AccessRequested(evidenceId, msg.sender);
    }

    // Victim grants access to a user
    function grantAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];
        require(e.hasRequested[user], "User did not request access");
        e.accessPermissions[user] = true;
        e.hasRequested[user] = false; // reset request status once granted
        emit AccessGranted(evidenceId, user);
    }

    // Victim revokes access
    function revokeAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];
        require(e.accessPermissions[user], "User has no access to revoke");
        e.accessPermissions[user] = false;
        emit AccessRevoked(evidenceId, user);
    }

    // Get evidence (shows encrypted data only to authorized users)
    function getEvidence(uint256 evidenceId)
        external
        view
        evidenceExists(evidenceId)
        returns (EvidenceView memory)
    {
        Evidence storage e = evidences[evidenceId];
        bool hasAccess = e.victim == msg.sender || e.accessPermissions[msg.sender];
        bool hasRequested = e.hasRequested[msg.sender];

        return EvidenceView({
            id: e.id,
            victim: e.victim,
            ipfsHash: hasAccess ? e.ipfsHash : "",
            encryptedKey: hasAccess ? e.encryptedKey : "",
            timestamp: e.timestamp,
            description: e.description,
            isActive: e.isActive,
            hasAccess: hasAccess,
            hasRequested: hasRequested
        });
    }

    // Get all evidence IDs uploaded by a user
    function getUserEvidences(address user) external view returns (uint256[] memory) {
        return userEvidences[user];
    }

    // Victim can see all access requests
    function getPermissionRequests(uint256 evidenceId)
        external
        view
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
        returns (address[] memory)
    {
        return evidences[evidenceId].permissionRequests;
    }

    // Check if a user currently has access
    function hasAccessPermission(uint256 evidenceId, address user)
        external
        view
        evidenceExists(evidenceId)
        returns (bool)
    {
        Evidence storage e = evidences[evidenceId];
        return e.victim == user || e.accessPermissions[user];
    }
}
