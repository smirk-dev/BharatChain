import React, { useEffect, useState } from "react";
import { getContract } from "../utils/web3";

function Dashboard() {
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    try {
      const contract = await getContract();
      const count = await contract.documentCount();
      const docs = [];

      for (let i = 0; i < count; i++) {
        const doc = await contract.documents(i);
        docs.push({
          hash: doc.ipfsHash,
          owner: doc.owner,
        });
      }

      setDocuments(docs);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Registered Documents</h2>
      {documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={index} className="border p-2 rounded">
              <p><strong>IPFS:</strong> <a href={`https://ipfs.io/ipfs/${doc.hash}`} target="_blank" rel="noopener noreferrer">{doc.hash}</a></p>
              <p><strong>Owner:</strong> {doc.owner}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
