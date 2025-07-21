import React, { useEffect, useState, useCallback } from "react";
import { getContract } from "../utils/web3";

function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const contract = await getContract();
      const count = await contract.documentCount();
      const docs = [];

      for (let i = 0; i < count; i++) {
        const doc = await contract.documents(i);
        docs.push({ hash: doc.ipfsHash, owner: doc.owner });
      }

      setDocuments(docs);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents from blockchain.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">📄 Registered Documents</h2>

      {loading && <p>Loading documents...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <p>No documents registered yet.</p>
      )}

      <ul className="space-y-3">
        {documents.map((doc, index) => (
          <li key={index} className="border p-3 rounded bg-gray-100">
            <p>
              <strong>IPFS:</strong>{" "}
              <a
                href={`https://ipfs.io/ipfs/${doc.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {doc.hash}
              </a>
            </p>
            <p><strong>Owner:</strong> {doc.owner}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
