// File: client/src/utils/web3.js
import { ethers } from "ethers";

// Replace with deployed contract address and ABI later
export const CONTRACT_ADDRESS = "0xYourContractAddressHere";
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
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "documents",
    "outputs": [
      { "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Connect to MetaMask and get signer
export const getSigner = async () => {
  if (!window.ethereum) {
    alert("MetaMask not found.");
    return null;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

// Get contract instance
export const getContract = async () => {
  const signer = await getSigner();
  if (!signer) return null;

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};
