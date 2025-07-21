// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    struct Document {
        string ipfsHash;
        address owner;
    }

    mapping(uint => Document) public documents;
    uint public documentCount = 0;

    function registerDocument(string memory ipfsHash) public {
        documents[documentCount] = Document(ipfsHash, msg.sender);
        documentCount++;
    }
}
