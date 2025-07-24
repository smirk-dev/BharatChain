// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CitizenRegistry.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DocumentRegistry is ReentrancyGuard {
    enum DocumentStatus { Pending, Verified, Rejected, Expired }
    enum DocumentType { Aadhar, PAN, VoterID, DrivingLicense, Passport, BirthCertificate, Other }
    
    struct Document {
        bytes32 documentId;
        address owner;
        address issuer;
        DocumentType docType;
        string ipfsHash;
        string metadataHash;
        DocumentStatus status;
        uint256 issuedDate;
        uint256 expiryDate;
        uint256 uploadDate;
        bool isActive;
    }
    
    CitizenRegistry public citizenRegistry;
    
    mapping(bytes32 => Document) public documents;
    mapping(address => bytes32[]) public citizenDocuments;
    mapping(address => bool) public authorizedIssuers;
    
    event DocumentUploaded(bytes32 indexed documentId, address indexed owner, DocumentType docType, uint256 timestamp);
    event DocumentVerified(bytes32 indexed documentId, address indexed verifier, uint256 timestamp);
    event DocumentRejected(bytes32 indexed documentId, address indexed verifier, string reason, uint256 timestamp);
    event IssuerAuthorized(address indexed issuer, string organization);
    event IssuerRevoked(address indexed issuer);
    
    modifier onlyDocumentOwner(bytes32 _documentId) {
        require(documents[_documentId].owner == msg.sender, "Not document owner");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not authorized issuer");
        _;
    }
    
    modifier onlyRegisteredCitizen() {
        require(citizenRegistry.isRegistered(msg.sender), "Not registered citizen");
        _;
    }
    
    constructor(address _citizenRegistryAddress) {
        citizenRegistry = CitizenRegistry(_citizenRegistryAddress);
    }
    
    function uploadDocument(
        DocumentType _docType,
        string memory _ipfsHash,
        string memory _metadataHash,
        uint256 _expiryDate
    ) external onlyRegisteredCitizen nonReentrant returns (bytes32) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        
        bytes32 documentId = keccak256(abi.encodePacked(
            msg.sender,
            _docType,
            _ipfsHash,
            block.timestamp
        ));
        
        documents[documentId] = Document({
            documentId: documentId,
            owner: msg.sender,
            issuer: address(0),
            docType: _docType,
            ipfsHash: _ipfsHash,
            metadataHash: _metadataHash,
            status: DocumentStatus.Pending,
            issuedDate: 0,
            expiryDate: _expiryDate,
            uploadDate: block.timestamp,
            isActive: true
        });
        
        citizenDocuments[msg.sender].push(documentId);
        
        emit DocumentUploaded(documentId, msg.sender, _docType, block.timestamp);
        return documentId;
    }
    
    function verifyDocument(bytes32 _documentId) external onlyAuthorizedIssuer nonReentrant {
        require(documents[_documentId].isActive, "Document not active");
        require(documents[_documentId].status == DocumentStatus.Pending, "Document not pending");
        
        documents[_documentId].status = DocumentStatus.Verified;
        documents[_documentId].issuer = msg.sender;
        documents[_documentId].issuedDate = block.timestamp;
        
        emit DocumentVerified(_documentId, msg.sender, block.timestamp);
    }
    
    function rejectDocument(bytes32 _documentId, string memory _reason) external onlyAuthorizedIssuer nonReentrant {
        require(documents[_documentId].isActive, "Document not active");
        require(documents[_documentId].status == DocumentStatus.Pending, "Document not pending");
        
        documents[_documentId].status = DocumentStatus.Rejected;
        
        emit DocumentRejected(_documentId, msg.sender, _reason, block.timestamp);
    }
    
    function getCitizenDocuments(address _citizen) external view returns (bytes32[] memory) {
        return citizenDocuments[_citizen];
    }
    
    function getDocument(bytes32 _documentId) external view returns (
        address owner,
        address issuer,
        DocumentType docType,
        string memory ipfsHash,
        DocumentStatus status,
        uint256 issuedDate,
        uint256 expiryDate,
        bool isActive
    ) {
        Document memory doc = documents[_documentId];
        return (
            doc.owner,
            doc.issuer,
            doc.docType,
            doc.ipfsHash,
            doc.status,
            doc.issuedDate,
            doc.expiryDate,
            doc.isActive
        );
    }
    
    function authorizeIssuer(address _issuer, string memory _organization) external {
        // This should be restricted to contract owner or governance
        require(_issuer != address(0), "Invalid issuer address");
        
        authorizedIssuers[_issuer] = true;
        
        emit IssuerAuthorized(_issuer, _organization);
    }
}
