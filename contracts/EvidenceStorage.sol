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
        address[] grantedAccess;                    // list of granted addresses
        mapping(address => uint256) grantedAt;      // granted timestamp
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
    event AccessDenied(uint256 indexed evidenceId, address indexed requester);
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

    // Victim grants access to a user. Removes them from pending list and
    // appends to grantedAccess array (so frontend can show who has been approved).
    function grantAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];
        require(e.hasRequested[user], "User did not request access");
        require(!e.accessPermissions[user], "User already granted");

        e.accessPermissions[user] = true;
        e.hasRequested[user] = false;
        e.grantedAccess.push(user);
        e.grantedAt[user] = block.timestamp;

        // remove from permissionRequests array
        for (uint256 i = 0; i < e.permissionRequests.length; i++) {
            if (e.permissionRequests[i] == user) {
                e.permissionRequests[i] = e.permissionRequests[e.permissionRequests.length - 1];
                e.permissionRequests.pop();
                break;
            }
        }

        emit AccessGranted(evidenceId, user);
    }

    // Victim explicitly deny a pending request. Clears pending flag & removes from array.
    function denyAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];
        require(e.hasRequested[user], "No pending request from user");

        e.hasRequested[user] = false;

        // remove from permissionRequests array
        for (uint256 i = 0; i < e.permissionRequests.length; i++) {
            if (e.permissionRequests[i] == user) {
                e.permissionRequests[i] = e.permissionRequests[e.permissionRequests.length - 1];
                e.permissionRequests.pop();
                break;
            }
        }

        emit AccessDenied(evidenceId, user);
    }

    // Victim revokes previously granted access
    function revokeAccess(uint256 evidenceId, address user)
        external
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
    {
        Evidence storage e = evidences[evidenceId];
        require(e.accessPermissions[user], "User has no access to revoke");
        e.accessPermissions[user] = false;
        e.grantedAt[user] = 0;

        // remove from grantedAccess array
        for (uint256 i = 0; i < e.grantedAccess.length; i++) {
            if (e.grantedAccess[i] == user) {
                e.grantedAccess[i] = e.grantedAccess[e.grantedAccess.length - 1];
                e.grantedAccess.pop();
                break;
            }
        }

        emit AccessRevoked(evidenceId, user);
    }

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

    function getUserEvidences(address user) external view returns (uint256[] memory) {
        return userEvidences[user];
    }

    // Return pending requests array for a given evidence (victim only)
    function getPermissionRequests(uint256 evidenceId)
        external
        view
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
        returns (address[] memory)
    {
        return evidences[evidenceId].permissionRequests;
    }

    // Return granted addresses for a given evidence (victim only)
    function getGrantedAddresses(uint256 evidenceId)
        external
        view
        onlyVictim(evidenceId)
        evidenceExists(evidenceId)
        returns (address[] memory)
    {
        return evidences[evidenceId].grantedAccess;
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
