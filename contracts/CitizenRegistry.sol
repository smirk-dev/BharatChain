// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CitizenRegistry
 * @dev Smart contract for managing citizen registration and verification
 */
contract CitizenRegistry is Ownable, ReentrancyGuard {
    
    struct Citizen {
        string aadharHash;      // Hashed Aadhar number for privacy
        string name;            // Full name
        string email;           // Email address
        string phone;           // Phone number
        bool isVerified;        // Verification status
        uint256 registrationDate;
        address walletAddress;  // Ethereum wallet address
    }
    
    // Mappings
    mapping(address => Citizen) public citizens;
    mapping(string => address) private aadharToAddress;
    mapping(address => bool) public verifiers;
    
    // Arrays for enumeration
    address[] public citizenAddresses;
    
    // Events
    event CitizenRegistered(address indexed citizenAddress, string name, uint256 timestamp);
    event CitizenVerified(address indexed citizenAddress, address indexed verifier, uint256 timestamp);
    event VerifierAdded(address indexed verifier, uint256 timestamp);
    event VerifierRemoved(address indexed verifier, uint256 timestamp);
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier citizenExists(address _citizen) {
        require(bytes(citizens[_citizen].aadharHash).length > 0, "Citizen not registered");
        _;
    }
    
    constructor() {
        verifiers[msg.sender] = true; // Owner is default verifier
    }
    
    /**
     * @dev Register a new citizen
     * @param _aadharHash Hashed Aadhar number
     * @param _name Full name
     * @param _email Email address  
     * @param _phone Phone number
     */
    function registerCitizen(
        string memory _aadharHash,
        string memory _name,
        string memory _email,
        string memory _phone
    ) external nonReentrant {
        require(bytes(_aadharHash).length > 0, "Aadhar hash required");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(citizens[msg.sender].aadharHash).length == 0, "Citizen already registered");
        require(aadharToAddress[_aadharHash] == address(0), "Aadhar already registered");
        
        citizens[msg.sender] = Citizen({
            aadharHash: _aadharHash,
            name: _name,
            email: _email,
            phone: _phone,
            isVerified: false,
            registrationDate: block.timestamp,
            walletAddress: msg.sender
        });
        
        aadharToAddress[_aadharHash] = msg.sender;
        citizenAddresses.push(msg.sender);
        
        emit CitizenRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Verify a citizen (only verifiers)
     * @param _citizenAddress Address of citizen to verify
     */
    function verifyCitizen(address _citizenAddress) 
        external 
        onlyVerifier 
        citizenExists(_citizenAddress) 
    {
        require(!citizens[_citizenAddress].isVerified, "Citizen already verified");
        
        citizens[_citizenAddress].isVerified = true;
        
        emit CitizenVerified(_citizenAddress, msg.sender, block.timestamp);
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
     * @dev Get citizen details
     * @param _citizenAddress Address of citizen
     * @return Citizen struct
     */
    function getCitizen(address _citizenAddress) 
        external 
        view 
        citizenExists(_citizenAddress)
        returns (Citizen memory) 
    {
        return citizens[_citizenAddress];
    }
    
    /**
     * @dev Check if citizen is registered
     * @param _citizenAddress Address to check
     * @return bool registration status
     */
    function isCitizenRegistered(address _citizenAddress) external view returns (bool) {
        return bytes(citizens[_citizenAddress].aadharHash).length > 0;
    }
    
    /**
     * @dev Get total number of registered citizens
     * @return uint256 total count
     */
    function getTotalCitizens() external view returns (uint256) {
        return citizenAddresses.length;
    }
    
    /**
     * @dev Get citizen address by Aadhar hash
     * @param _aadharHash Hashed Aadhar number
     * @return address of citizen
     */
    function getCitizenByAadhar(string memory _aadharHash) external view returns (address) {
        return aadharToAddress[_aadharHash];
    }
    
    /**
     * @dev Update citizen profile (only by citizen)
     * @param _name New name
     * @param _email New email
     * @param _phone New phone
     */
    function updateProfile(
        string memory _name,
        string memory _email,
        string memory _phone
    ) external citizenExists(msg.sender) {
        require(bytes(_name).length > 0, "Name required");
        
        Citizen storage citizen = citizens[msg.sender];
        citizen.name = _name;
        citizen.email = _email;
        citizen.phone = _phone;
    }
}
