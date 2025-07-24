// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CitizenRegistry.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GrievanceSystem is ReentrancyGuard {
    enum GrievanceStatus { Open, InProgress, Resolved, Closed, Escalated }
    enum Priority { Low, Medium, High, Critical }
    
    struct Grievance {
        uint256 grievanceId;
        address citizen;
        string title;
        string description;
        string category;
        Priority priority;
        GrievanceStatus status;
        address assignedOfficer;
        string resolution;
        uint256 createdDate;
        uint256 updatedDate;
        uint256 resolvedDate;
        int8 sentimentScore; // -100 to +100
        bool isActive;
    }
    
    CitizenRegistry public citizenRegistry;
    
    mapping(uint256 => Grievance) public grievances;
    mapping(address => uint256[]) public citizenGrievances;
    mapping(address => uint256[]) public officerGrievances;
    mapping(address => bool) public authorizedOfficers;
    
    uint256 public nextGrievanceId = 1;
    
    event GrievanceSubmitted(uint256 indexed grievanceId, address indexed citizen, string title, uint256 timestamp);
    event GrievanceAssigned(uint256 indexed grievanceId, address indexed officer, uint256 timestamp);
    event GrievanceStatusUpdated(uint256 indexed grievanceId, GrievanceStatus status, uint256 timestamp);
    event GrievanceResolved(uint256 indexed grievanceId, string resolution, uint256 timestamp);
    event OfficerAuthorized(address indexed officer, string department);
    
    modifier onlyRegisteredCitizen() {
        require(citizenRegistry.isRegistered(msg.sender), "Not registered citizen");
        _;
    }
    
    modifier onlyAuthorizedOfficer() {
        require(authorizedOfficers[msg.sender], "Not authorized officer");
        _;
    }
    
    modifier onlyGrievanceOwner(uint256 _grievanceId) {
        require(grievances[_grievanceId].citizen == msg.sender, "Not grievance owner");
        _;
    }
    
    constructor(address _citizenRegistryAddress) {
        citizenRegistry = CitizenRegistry(_citizenRegistryAddress);
    }
    
    function submitGrievance(
        string memory _title,
        string memory _description,
        string memory _category,
        Priority _priority,
        int8 _sentimentScore
    ) external onlyRegisteredCitizen nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_sentimentScore >= -100 && _sentimentScore <= 100, "Invalid sentiment score");
        
        uint256 grievanceId = nextGrievanceId++;
        
        grievances[grievanceId] = Grievance({
            grievanceId: grievanceId,
            citizen: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            priority: _priority,
            status: GrievanceStatus.Open,
            assignedOfficer: address(0),
            resolution: "",
            createdDate: block.timestamp,
            updatedDate: block.timestamp,
            resolvedDate: 0,
            sentimentScore: _sentimentScore,
            isActive: true
        });
        
        citizenGrievances[msg.sender].push(grievanceId);
        
        emit GrievanceSubmitted(grievanceId, msg.sender, _title, block.timestamp);
        return grievanceId;
    }
    
    function assignGrievance(uint256 _grievanceId, address _officer) external onlyAuthorizedOfficer nonReentrant {
        require(grievances[_grievanceId].isActive, "Grievance not active");
        require(grievances[_grievanceId].status == GrievanceStatus.Open, "Grievance not open");
        require(authorizedOfficers[_officer], "Officer not authorized");
        
        grievances[_grievanceId].assignedOfficer = _officer;
        grievances[_grievanceId].status = GrievanceStatus.InProgress;
        grievances[_grievanceId].updatedDate = block.timestamp;
        
        officerGrievances[_officer].push(_grievanceId);
        
        emit GrievanceAssigned(_grievanceId, _officer, block.timestamp);
        emit GrievanceStatusUpdated(_grievanceId, GrievanceStatus.InProgress, block.timestamp);
    }
    
    function updateGrievanceStatus(uint256 _grievanceId, GrievanceStatus _status) external onlyAuthorizedOfficer nonReentrant {
        require(grievances[_grievanceId].isActive, "Grievance not active");
        require(grievances[_grievanceId].assignedOfficer == msg.sender, "Not assigned officer");
        
        grievances[_grievanceId].status = _status;
        grievances[_grievanceId].updatedDate = block.timestamp;
        
        emit GrievanceStatusUpdated(_grievanceId, _status, block.timestamp);
    }
    
    function resolveGrievance(uint256 _grievanceId, string memory _resolution) external onlyAuthorizedOfficer nonReentrant {
        require(grievances[_grievanceId].isActive, "Grievance not active");
        require(grievances[_grievanceId].assignedOfficer == msg.sender, "Not assigned officer");
        require(bytes(_resolution).length > 0, "Resolution required");
        
        grievances[_grievanceId].status = GrievanceStatus.Resolved;
        grievances[_grievanceId].resolution = _resolution;
        grievances[_grievanceId].resolvedDate = block.timestamp;
        grievances[_grievanceId].updatedDate = block.timestamp;
        
        emit GrievanceResolved(_grievanceId, _resolution, block.timestamp);
    }
    
    function getCitizenGrievances(address _citizen) external view returns (uint256[] memory) {
        return citizenGrievances[_citizen];
    }
    
    function getOfficerGrievances(address _officer) external view returns (uint256[] memory) {
        return officerGrievances[_officer];
    }
    
    function authorizeOfficer(address _officer, string memory _department) external {
        // This should be restricted to contract owner or governance
        require(_officer != address(0), "Invalid officer address");
        
        authorizedOfficers[_officer] = true;
        
        emit OfficerAuthorized(_officer, _department);
    }
}
