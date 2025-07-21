// File: client/src/pages/Upload.jsx
import React, { useState } from "react";
import axios from "axios";
import { getContract } from "../utils/web3"; // <-- Import here

function Upload() {
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false); // <-- New state

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setIpfsHash(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/api/upload", formData);
      setIpfsHash(response.data.IpfsHash || response.data.Hash);
      setLoading(false);
    } catch (err) {
      console.error("Upload failed:", err);
      setLoading(false);
    }
  };

  // --- Add this function ---
  const registerDocumentOnChain = async () => {
    if (!ipfsHash) return alert("No IPFS hash to register.");

    try {
      setRegistering(true);
      const contract = await getContract();
      const tx = await contract.registerDocument(ipfsHash);
      await tx.wait();
      alert("✅ Document registered on blockchain.");
      setRegistering(false);
    } catch (err) {
      console.error("Blockchain registration failed:", err);
      alert("❌ Failed to register on blockchain.");
      setRegistering(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload Document to IPFS</h2>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <br />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {ipfsHash && (
        <div className="mt-4">
          <p className="text-sm text-gray-700">Uploaded IPFS Hash:</p>
          <a
            href={`https://ipfs.io/ipfs/${ipfsHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {ipfsHash}
          </a>
          <br />
          <button
            onClick={registerDocumentOnChain}
            disabled={registering}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700"
          >
            {registering ? "Registering..." : "Register on Blockchain"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Upload;
