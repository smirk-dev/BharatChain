// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CitizenRegistry is Ownable, ReentrancyGuard {
    struct Citizen {
        string name;
        string aadharHash;
        string email;
        string phoneHash;
        address walletAddress;
        bool isVerified;
        bool isActive;
        uint256 registrationDate;
        uint256 verificationDate;
    }
    
    struct Verifier {
        address verifierAddress;
        string organization;
        bool isAuthorized;
        uint256 addedDate;
    }
    
    mapping(address => Citizen) public citizens;
    mapping(string => address) public aadharToAddress;
    mapping(address => Verifier) public verifiers;
    mapping(address => bool) public isRegistered;
    
    event CitizenRegistered(address indexed citizen, string name, uint256 timestamp);
    event CitizenVerified(address indexed citizen, address indexed verifier, uint256 timestamp);
    event VerifierAdded(address indexed verifier, string organization);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender].isAuthorized, "Not authorized verifier");
        _;
    }
    
    modifier onlyRegisteredCitizen() {
        require(isRegistered[msg.sender], "Not registered citizen");
        _;
    }
    
    constructor() {}
    
    function registerCitizen(
        string memory _name,
        string memory _aadharHash,
        string memory _email,
        string memory _phoneHash
    ) external nonReentrant {
        require(!isRegistered[msg.sender], "Citizen already registered");
        require(aadharToAddress[_aadharHash] == address(0), "Aadhar already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_aadharHash).length > 0, "Aadhar hash required");
        
        citizens[msg.sender] = Citizen({
            name: _name,
            aadharHash: _aadharHash,
            email: _email,
            phoneHash: _phoneHash,
            walletAddress: msg.sender,
            isVerified: false,
            isActive: true,
            registrationDate: block.timestamp,
            verificationDate: 0
        });
        
        aadharToAddress[_aadharHash] = msg.sender;
        isRegistered[msg.sender] = true;
        
        emit CitizenRegistered(msg.sender, _name, block.timestamp);
    }
    
    function verifyCitizen(address _citizenAddress) external onlyVerifier nonReentrant {
        require(isRegistered[_citizenAddress], "Citizen not registered");
        require(!citizens[_citizenAddress].isVerified, "Citizen already verified");
        
        citizens[_citizenAddress].isVerified = true;
        citizens[_citizenAddress].verificationDate = block.timestamp;
        
        emit CitizenVerified(_citizenAddress, msg.sender, block.timestamp);
    }
    
    function addVerifier(address _verifier, string memory _organization) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        require(!verifiers[_verifier].isAuthorized, "Verifier already exists");
        
        verifiers[_verifier] = Verifier({
            verifierAddress: _verifier,
            organization: _organization,
            isAuthorized: true,
            addedDate: block.timestamp
        });
        
        emit VerifierAdded(_verifier, _organization);
    }
    
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier].isAuthorized, "Verifier not found");
        
        verifiers[_verifier].isAuthorized = false;
        
        emit VerifierRemoved(_verifier);
    }
    
    function getCitizen(address _citizenAddress) external view returns (
        string memory name,
        string memory email,
        bool isVerified,
        bool isActive,
        uint256 registrationDate,
        uint256 verificationDate
    ) {
        Citizen memory citizen = citizens[_citizenAddress];
        return (
            citizen.name,
            citizen.email,
            citizen.isVerified,
            citizen.isActive,
            citizen.registrationDate,
            citizen.verificationDate
        );
    }
    
    function getRegisteredCitizensCount() external view returns (uint256) {
        // Note: This is a simplified count. In production, you'd maintain a counter
        return 0; // Implement proper counting mechanism
    }
}
