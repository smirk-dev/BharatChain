// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DocumentRegistry
 * @dev Smart contract for managing document storage and verification
 */
contract DocumentRegistry is Ownable, ReentrancyGuard {
    
    enum DocumentType {
        AADHAR,
        PAN,
        DRIVING_LICENSE,
        PASSPORT,
        VOTER_ID,
        BIRTH_CERTIFICATE,
        OTHER
    }
    
    enum DocumentStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        EXPIRED
    }
    
    struct Document {
        uint256 id;
        address owner;
        string documentHash;    // IPFS hash
        DocumentType docType;
        DocumentStatus status;
        string metadata;        // JSON metadata
        uint256 uploadDate;
        uint256 verificationDate;
        address verifier;
        string rejectionReason;
        uint256 expiryDate;
    }
    
    // Mappings
    mapping(uint256 => Document) public documents;
    mapping(address => uint256[]) public userDocuments;
    mapping(address => bool) public verifiers;
    mapping(string => bool) private documentHashes;
    
    // State variables
    uint256 private nextDocumentId = 1;
    uint256 public totalDocuments;
    
    // Events
    event DocumentUploaded(
        uint256 indexed documentId, 
        address indexed owner, 
        DocumentType docType, 
        string documentHash,
        uint256 timestamp
    );
    
    event DocumentVerified(
        uint256 indexed documentId, 
        address indexed verifier, 
        uint256 timestamp
    );
    
    event DocumentRejected(
        uint256 indexed documentId, 
        address indexed verifier, 
        string reason,
        uint256 timestamp
    );
    
    event VerifierAdded(address indexed verifier, uint256 timestamp);
    event VerifierRemoved(address indexed verifier, uint256 timestamp);
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier onlyDocumentOwner(uint256 _documentId) {
        require(documents[_documentId].owner == msg.sender, "Not document owner");
        _;
    }
    
    modifier documentExists(uint256 _documentId) {
        require(documents[_documentId].id != 0, "Document does not exist");
        _;
    }
    
    constructor() {
        verifiers[msg.sender] = true; // Owner is default verifier
    }
    
    /**
     * @dev Upload a new document
     * @param _documentHash IPFS hash of the document
     * @param _docType Type of document
     * @param _metadata JSON metadata about the document
     * @param _expiryDate Expiry date (0 for no expiry)
     */
    function uploadDocument(
        string memory _documentHash,
        DocumentType _docType,
        string memory _metadata,
        uint256 _expiryDate
    ) external nonReentrant returns (uint256) {
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(!documentHashes[_documentHash], "Document already exists");
        require(_expiryDate == 0 || _expiryDate > block.timestamp, "Invalid expiry date");
        
        uint256 documentId = nextDocumentId++;
        
        documents[documentId] = Document({
            id: documentId,
            owner: msg.sender,
            documentHash: _documentHash,
            docType: _docType,
            status: DocumentStatus.PENDING,
            metadata: _metadata,
            uploadDate: block.timestamp,
            verificationDate: 0,
            verifier: address(0),
            rejectionReason: "",
            expiryDate: _expiryDate
        });
        
        userDocuments[msg.sender].push(documentId);
        documentHashes[_documentHash] = true;
        totalDocuments++;
        
        emit DocumentUploaded(documentId, msg.sender, _docType, _documentHash, block.timestamp);
        
        return documentId;
    }
    
    /**
     * @dev Verify a document (only verifiers)
     * @param _documentId ID of document to verify
     */
    function verifyDocument(uint256 _documentId) 
        external 
        onlyVerifier 
        documentExists(_documentId) 
    {
        Document storage doc = documents[_documentId];
        require(doc.status == DocumentStatus.PENDING, "Document not pending verification");
        require(doc.expiryDate == 0 || doc.expiryDate > block.timestamp, "Document expired");
        
        doc.status = DocumentStatus.VERIFIED;
        doc.verificationDate = block.timestamp;
        doc.verifier = msg.sender;
        
        emit DocumentVerified(_documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Reject a document (only verifiers)
     * @param _documentId ID of document to reject
     * @param _reason Reason for rejection
     */
    function rejectDocument(uint256 _documentId, string memory _reason) 
        external 
        onlyVerifier 
        documentExists(_documentId) 
    {
        require(bytes(_reason).length > 0, "Rejection reason required");
        
        Document storage doc = documents[_documentId];
        require(doc.status == DocumentStatus.PENDING, "Document not pending verification");
        
        doc.status = DocumentStatus.REJECTED;
        doc.verificationDate = block.timestamp;
        doc.verifier = msg.sender;
        doc.rejectionReason = _reason;
        
        emit DocumentRejected(_documentId, msg.sender, _reason, block.timestamp);
    }
    
    /**
     * @dev Add a new verifier (only owner)
     * @param _verifier Address to add as verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        require(!verifiers[_verifier], "Already a verifier");
        
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier, block.timestamp);
    }
    
    /**
     * @dev Remove a verifier (only owner)
     * @param _verifier Address to remove as verifier
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Not a verifier");
        require(_verifier != owner(), "Cannot remove owner");
        
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier, block.timestamp);
    }
    
    /**
     * @dev Get document details
     * @param _documentId ID of document
     * @return Document struct
     */
    function getDocument(uint256 _documentId) 
        external 
        view 
        documentExists(_documentId)
        returns (Document memory) 
    {
        return documents[_documentId];
    }
    
    /**
     * @dev Get user's documents
     * @param _user Address of user
     * @return Array of document IDs
     */
    function getUserDocuments(address _user) external view returns (uint256[] memory) {
        return userDocuments[_user];
    }
    
    /**
     * @dev Get documents by status
     * @param _status Document status to filter by
     * @return Array of document IDs
     */
    function getDocumentsByStatus(DocumentStatus _status) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory result = new uint256[](totalDocuments);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextDocumentId; i++) {
            if (documents[i].status == _status) {
                result[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory filteredResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            filteredResult[i] = result[i];
        }
        
        return filteredResult;
    }
    
    /**
     * @dev Check if document is verified
     * @param _documentId ID of document
     * @return bool verification status
     */
    function isDocumentVerified(uint256 _documentId) 
        external 
        view 
        documentExists(_documentId)
        returns (bool) 
    {
        return documents[_documentId].status == DocumentStatus.VERIFIED;
    }
    
    /**
     * @dev Mark expired documents
     * @param _documentIds Array of document IDs to check
     */
    function markExpiredDocuments(uint256[] memory _documentIds) external {
        for (uint256 i = 0; i < _documentIds.length; i++) {
            uint256 docId = _documentIds[i];
            Document storage doc = documents[docId];
            
            if (doc.id != 0 && 
                doc.expiryDate != 0 && 
                doc.expiryDate <= block.timestamp && 
                doc.status == DocumentStatus.VERIFIED) {
                doc.status = DocumentStatus.EXPIRED;
            }
        }
    }
}
