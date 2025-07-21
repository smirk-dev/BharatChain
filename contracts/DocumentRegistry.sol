// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    struct Document {
        string ipfsHash;
        address owner;
    }

    mapping(uint => Document) public documents;
    uint public documentCount;

    event DocumentRegistered(uint indexed id, string ipfsHash, address indexed owner);

    function registerDocument(string memory ipfsHash) public {
        documents[documentCount] = Document(ipfsHash, msg.sender);
        emit DocumentRegistered(documentCount, ipfsHash, msg.sender);
        documentCount++;
    }

    function getDocument(uint id) public view returns (string memory, address) {
        Document memory doc = documents[id];
        return (doc.ipfsHash, doc.owner);
    }
}
