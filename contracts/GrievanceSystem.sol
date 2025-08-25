// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GrievanceSystem
 * @dev Smart contract for managing public grievances and complaints
 */
contract GrievanceSystem is Ownable, ReentrancyGuard {
    
    enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
    
    enum Status {
        SUBMITTED,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        ESCALATED
    }
    
    enum Category {
        INFRASTRUCTURE,
        WATER_SUPPLY,
        ELECTRICITY,
        SANITATION,
        ROADS,
        HEALTHCARE,
        EDUCATION,
        CORRUPTION,
        OTHER
    }
    
    struct Grievance {
        uint256 id;
        address citizen;
        string title;
        string description;
        Category category;
        Priority priority;
        Status status;
        uint256 submitDate;
        uint256 resolvedDate;
        address assignedOfficer;
        string resolution;
        uint256 satisfactionRating; // 1-5 scale
        string[] comments;
        string location;
        string[] attachments; // IPFS hashes
    }
    
    struct Comment {
        address author;
        string content;
        uint256 timestamp;
        bool isOfficial;
    }
    
    // Mappings
    mapping(uint256 => Grievance) public grievances;
    mapping(uint256 => Comment[]) public grievanceComments;
    mapping(address => uint256[]) public citizenGrievances;
    mapping(address => uint256[]) public officerGrievances;
    mapping(address => bool) public officers;
    mapping(Category => address) public categoryOfficers;
    
    // State variables
    uint256 private nextGrievanceId = 1;
    uint256 public totalGrievances;
    
    // Events
    event GrievanceSubmitted(
        uint256 indexed grievanceId,
        address indexed citizen,
        Category category,
        Priority priority,
        uint256 timestamp
    );
    
    event GrievanceAssigned(
        uint256 indexed grievanceId,
        address indexed officer,
        uint256 timestamp
    );
    
    event GrievanceStatusUpdated(
        uint256 indexed grievanceId,
        Status oldStatus,
        Status newStatus,
        uint256 timestamp
    );
    
    event GrievanceResolved(
        uint256 indexed grievanceId,
        address indexed officer,
        string resolution,
        uint256 timestamp
    );
    
    event CommentAdded(
        uint256 indexed grievanceId,
        address indexed author,
        string content,
        bool isOfficial,
        uint256 timestamp
    );
    
    event OfficerAdded(address indexed officer, uint256 timestamp);
    event OfficerRemoved(address indexed officer, uint256 timestamp);
    
    // Modifiers
    modifier onlyOfficer() {
        require(officers[msg.sender] || msg.sender == owner(), "Not authorized officer");
        _;
    }
    
    modifier onlyGrievanceParticipant(uint256 _grievanceId) {
        Grievance memory grievance = grievances[_grievanceId];
        require(
            msg.sender == grievance.citizen || 
            msg.sender == grievance.assignedOfficer || 
            officers[msg.sender] || 
            msg.sender == owner(),
            "Not authorized to access this grievance"
        );
        _;
    }
    
    modifier grievanceExists(uint256 _grievanceId) {
        require(grievances[_grievanceId].id != 0, "Grievance does not exist");
        _;
    }
    
    constructor() {
        officers[msg.sender] = true; // Owner is default officer
    }
    
    /**
     * @dev Submit a new grievance
     * @param _title Title of the grievance
     * @param _description Detailed description
     * @param _category Category of the grievance
     * @param _priority Priority level
     * @param _location Location of the issue
     * @param _attachments Array of IPFS hashes for attachments
     */
    function submitGrievance(
        string memory _title,
        string memory _description,
        Category _category,
        Priority _priority,
        string memory _location,
        string[] memory _attachments
    ) external nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        
        uint256 grievanceId = nextGrievanceId++;
        
        grievances[grievanceId] = Grievance({
            id: grievanceId,
            citizen: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            priority: _priority,
            status: Status.SUBMITTED,
            submitDate: block.timestamp,
            resolvedDate: 0,
            assignedOfficer: address(0),
            resolution: "",
            satisfactionRating: 0,
            comments: new string[](0),
            location: _location,
            attachments: _attachments
        });
        
        citizenGrievances[msg.sender].push(grievanceId);
        totalGrievances++;
        
        // Auto-assign to category officer if available
        address categoryOfficer = categoryOfficers[_category];
        if (categoryOfficer != address(0)) {
            _assignGrievance(grievanceId, categoryOfficer);
        }
        
        emit GrievanceSubmitted(grievanceId, msg.sender, _category, _priority, block.timestamp);
        
        return grievanceId;
    }
    
    /**
     * @dev Assign grievance to an officer
     * @param _grievanceId ID of the grievance
     * @param _officer Address of the officer
     */
    function assignGrievance(uint256 _grievanceId, address _officer) 
        external 
        onlyOfficer 
        grievanceExists(_grievanceId) 
    {
        require(officers[_officer], "Invalid officer");
        _assignGrievance(_grievanceId, _officer);
    }
    
    /**
     * @dev Internal function to assign grievance
     */
    function _assignGrievance(uint256 _grievanceId, address _officer) internal {
        Grievance storage grievance = grievances[_grievanceId];
        require(grievance.status == Status.SUBMITTED, "Grievance already assigned");
        
        grievance.assignedOfficer = _officer;
        grievance.status = Status.IN_PROGRESS;
        
        officerGrievances[_officer].push(_grievanceId);
        
        emit GrievanceAssigned(_grievanceId, _officer, block.timestamp);
        emit GrievanceStatusUpdated(_grievanceId, Status.SUBMITTED, Status.IN_PROGRESS, block.timestamp);
    }
    
    /**
     * @dev Update grievance status
     * @param _grievanceId ID of the grievance
     * @param _newStatus New status
     */
    function updateGrievanceStatus(uint256 _grievanceId, Status _newStatus) 
        external 
        onlyOfficer 
        grievanceExists(_grievanceId) 
    {
        Grievance storage grievance = grievances[_grievanceId];
        Status oldStatus = grievance.status;
        require(oldStatus != _newStatus, "Status already set");
        
        grievance.status = _newStatus;
        
        emit GrievanceStatusUpdated(_grievanceId, oldStatus, _newStatus, block.timestamp);
    }
    
    /**
     * @dev Resolve a grievance
     * @param _grievanceId ID of the grievance
     * @param _resolution Resolution description
     */
    function resolveGrievance(uint256 _grievanceId, string memory _resolution) 
        external 
        onlyOfficer 
        grievanceExists(_grievanceId) 
    {
        require(bytes(_resolution).length > 0, "Resolution required");
        
        Grievance storage grievance = grievances[_grievanceId];
        require(grievance.status == Status.IN_PROGRESS, "Grievance not in progress");
        
        grievance.status = Status.RESOLVED;
        grievance.resolution = _resolution;
        grievance.resolvedDate = block.timestamp;
        
        emit GrievanceResolved(_grievanceId, msg.sender, _resolution, block.timestamp);
        emit GrievanceStatusUpdated(_grievanceId, Status.IN_PROGRESS, Status.RESOLVED, block.timestamp);
    }
    
    /**
     * @dev Add comment to grievance
     * @param _grievanceId ID of the grievance
     * @param _content Comment content
     */
    function addComment(uint256 _grievanceId, string memory _content) 
        external 
        grievanceExists(_grievanceId)
        onlyGrievanceParticipant(_grievanceId)
    {
        require(bytes(_content).length > 0, "Comment content required");
        
        bool isOfficial = officers[msg.sender];
        
        grievanceComments[_grievanceId].push(Comment({
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            isOfficial: isOfficial
        }));
        
        emit CommentAdded(_grievanceId, msg.sender, _content, isOfficial, block.timestamp);
    }
    
    /**
     * @dev Rate resolution satisfaction (only citizen)
     * @param _grievanceId ID of the grievance
     * @param _rating Rating from 1-5
     */
    function rateSatisfaction(uint256 _grievanceId, uint256 _rating) 
        external 
        grievanceExists(_grievanceId) 
    {
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        Grievance storage grievance = grievances[_grievanceId];
        require(msg.sender == grievance.citizen, "Only citizen can rate");
        require(grievance.status == Status.RESOLVED, "Grievance not resolved");
        require(grievance.satisfactionRating == 0, "Already rated");
        
        grievance.satisfactionRating = _rating;
    }
    
    /**
     * @dev Add officer
     * @param _officer Address to add as officer
     */
    function addOfficer(address _officer) external onlyOwner {
        require(_officer != address(0), "Invalid address");
        require(!officers[_officer], "Already an officer");
        
        officers[_officer] = true;
        emit OfficerAdded(_officer, block.timestamp);
    }
    
    /**
     * @dev Remove officer
     * @param _officer Address to remove as officer
     */
    function removeOfficer(address _officer) external onlyOwner {
        require(officers[_officer], "Not an officer");
        require(_officer != owner(), "Cannot remove owner");
        
        officers[_officer] = false;
        emit OfficerRemoved(_officer, block.timestamp);
    }
    
    /**
     * @dev Set category officer
     * @param _category Category to assign
     * @param _officer Officer address
     */
    function setCategoryOfficer(Category _category, address _officer) external onlyOwner {
        require(officers[_officer], "Invalid officer");
        categoryOfficers[_category] = _officer;
    }
    
    /**
     * @dev Get grievance details
     * @param _grievanceId ID of grievance
     * @return Grievance struct
     */
    function getGrievance(uint256 _grievanceId) 
        external 
        view 
        grievanceExists(_grievanceId)
        onlyGrievanceParticipant(_grievanceId)
        returns (Grievance memory) 
    {
        return grievances[_grievanceId];
    }
    
    /**
     * @dev Get grievance comments
     * @param _grievanceId ID of grievance
     * @return Array of comments
     */
    function getGrievanceComments(uint256 _grievanceId) 
        external 
        view 
        grievanceExists(_grievanceId)
        onlyGrievanceParticipant(_grievanceId)
        returns (Comment[] memory) 
    {
        return grievanceComments[_grievanceId];
    }
    
    /**
     * @dev Get citizen's grievances
     * @param _citizen Address of citizen
     * @return Array of grievance IDs
     */
    function getCitizenGrievances(address _citizen) external view returns (uint256[] memory) {
        return citizenGrievances[_citizen];
    }
    
    /**
     * @dev Get officer's assigned grievances
     * @param _officer Address of officer
     * @return Array of grievance IDs
     */
    function getOfficerGrievances(address _officer) external view returns (uint256[] memory) {
        return officerGrievances[_officer];
    }
    
    /**
     * @dev Get grievances by status
     * @param _status Status to filter by
     * @return Array of grievance IDs
     */
    function getGrievancesByStatus(Status _status) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](totalGrievances);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextGrievanceId; i++) {
            if (grievances[i].status == _status) {
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
}
