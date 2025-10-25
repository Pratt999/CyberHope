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
        mapping(address => bool) hasRequested;
        address[] permissionRequests;
        address[] grantedUsers;
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
    event AccessRejected(uint256 indexed evidenceId, address indexed user);

    modifier evidenceExists(uint256 evidenceId) {
        require(evidences[evidenceId].victim != address(0), "Evidence does not exist");
        _;
    }

    modifier onlyVictim(uint256 evidenceId) {
        require(evidences[evidenceId].victim == msg.sender, "Only victim can perform this action");
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
        Evidence storage evi = evidences[evidenceId];
        require(evi.victim != msg.sender, "Victim already has access");
        require(!evi.hasRequested[msg.sender], "Already requested");
        require(!evi.accessPermissions[msg.sender], "Already granted");

        evi.hasRequested[msg.sender] = true;
        evi.permissionRequests.push(msg.sender);

        emit AccessRequested(evidenceId, msg.sender);
    }

    function grantAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage evi = evidences[evidenceId];
        require(evi.hasRequested[user], "User did not request access");

        evi.accessPermissions[user] = true;
        evi.hasRequested[user] = false;
        evi.grantedUsers.push(user);

        emit AccessGranted(evidenceId, user);
    }

    function rejectAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage evi = evidences[evidenceId];
        require(evi.hasRequested[user], "No pending request found");
        evi.hasRequested[user] = false;

        emit AccessRejected(evidenceId, user);
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
        Evidence storage evi = evidences[evidenceId];
        bool hasAccess = (msg.sender == evi.victim || evi.accessPermissions[msg.sender]);
        bool hasRequested = evi.hasRequested[msg.sender];

        return EvidenceView({
            id: evi.id,
            victim: evi.victim,
            ipfsHash: hasAccess ? evi.ipfsHash : "",
            encryptedKey: hasAccess ? evi.encryptedKey : "",
            timestamp: evi.timestamp,
            description: evi.description,
            isActive: evi.isActive,
            hasAccess: hasAccess,
            hasRequested: hasRequested
        });
    }

    function getEvidenceSummary(uint256 evidenceId)
        external
        view
        evidenceExists(evidenceId)
        returns (
            uint256 id,
            address victim,
            string memory description,
            bool isActive,
            bool hasAccess,
            bool hasRequested
        )
    {
        Evidence storage evi = evidences[evidenceId];
        return (
            evi.id,
            evi.victim,
            evi.description,
            evi.isActive,
            (msg.sender == evi.victim || evi.accessPermissions[msg.sender]),
            evi.hasRequested[msg.sender]
        );
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

    function getGrantedUsers(uint256 evidenceId)
        external
        view
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
        returns (address[] memory)
    {
        return evidences[evidenceId].grantedUsers;
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
