// File: client/src/utils/web3.js
import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your deployed address
export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "ipfsHash", "type": "string" }
    ],
    "name": "registerDocument",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "documentCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "documents",
    "outputs": [
      { "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "getDocument",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "DocumentRegistered",
    "type": "event"
  }
];

export const getSigner = async () => {
  if (!window.ethereum) {
    alert("MetaMask not found.");
    return null;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getContract = async () => {
  const signer = await getSigner();
  if (!signer) return null;

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};