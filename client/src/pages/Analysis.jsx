// File: client/src/pages/Analysis.jsx
import React, { useState } from "react";
import axios from "axios";

function Analysis() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/process/analyze", { text });
      setResult(response.data);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Feedback Analysis</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        rows="5"
        placeholder="Enter your feedback..."
      />
      <button
        onClick={analyzeText}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Analysis Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Analysis;