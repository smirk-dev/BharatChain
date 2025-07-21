// File: client/src/pages/Verify.jsx
import React, { useState } from "react";
import axios from "axios";
import { getContract } from "../utils/web3";

function Verify() {
  const [ipfsHash, setIpfsHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyDocument = async () => {
    if (!ipfsHash.trim()) return;
    
    setLoading(true);
    try {
      // Check blockchain
      const contract = await getContract();
      const count = await contract.documentCount();
      
      let exists = false;
      for (let i = 0; i < count; i++) {
        const doc = await contract.documents(i);
        if (doc.ipfsHash === ipfsHash) {
          exists = true;
          break;
        }
      }
      
      // Check for fraud
      const fraudResponse = await axios.post("http://localhost:5000/api/fraud/detect", {
        documentData: { hash: ipfsHash }
      });
      
      setVerificationResult({
        registered: exists,
        isFraudulent: fraudResponse.data.isFraudulent
      });
    } catch (err) {
      console.error("Verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Document Verification</h2>
      <input
        type="text"
        value={ipfsHash}
        onChange={(e) => setIpfsHash(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        placeholder="Enter IPFS hash to verify"
      />
      <button
        onClick={verifyDocument}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      {verificationResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Verification Result:</h3>
          <p>Registered on Blockchain: {verificationResult.registered ? "✅" : "❌"}</p>
          <p>Fraud Detection: {verificationResult.isFraudulent ? "⚠️ Suspicious" : "✅ Clean"}</p>
        </div>
      )}
    </div>
  );
}

export default Verify;