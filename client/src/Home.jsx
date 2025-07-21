// File: client/src/pages/Home.jsx
import React, { useState } from "react";
import { ethers } from "ethers";

function Home() {
  const [walletAddress, setWalletAddress] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to use this feature.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Welcome to BharatChain</h2>
      <p className="mb-6">
        BharatChain is a decentralized platform for managing official documents and transactions for Indian citizens and the government.
        It ensures transparency, accountability, and efficiency by combining blockchain with AI technologies.
      </p>

      {!walletAddress ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="text-green-700">✅ Connected: {walletAddress}</p>
      )}

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2">Features Coming Soon:</h3>
        <ul className="list-disc ml-6">
          <li>Upload and Verify Documents via Blockchain</li>
          <li>AI Fraud Detection and Classification</li>
          <li>Citizen Feedback Analysis Dashboard</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
