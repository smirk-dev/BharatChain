// File: contracts/DocumentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    struct Document {
        string ipfsHash;
        address owner;
        uint256 timestamp;
    }

    Document[] public documents;
    mapping(string => bool) public hashExists;

    event DocumentRegistered(uint256 indexed id, string ipfsHash, address owner);

    function registerDocument(string memory ipfsHash) external {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(!hashExists[ipfsHash], "Document already registered");

        documents.push(Document(ipfsHash, msg.sender, block.timestamp));
        hashExists[ipfsHash] = true;

        emit DocumentRegistered(documents.length - 1, ipfsHash, msg.sender);
    }

    function documentCount() external view returns (uint256) {
        return documents.length;
    }

    function getDocument(uint256 index) external view returns (string memory, address, uint256) {
        require(index < documents.length, "Index out of bounds");
        Document memory doc = documents[index];
        return (doc.ipfsHash, doc.owner, doc.timestamp);
    }
}