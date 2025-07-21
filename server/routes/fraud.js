// File: server/routes/fraud.js
const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");

router.post("/detect", async (req, res) => {
  const { documentData } = req.body;
  
  const pythonProcess = spawn("python", ["./ml-models/detect_fraud.py", JSON.stringify(documentData)]);
  
  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Fraud detection failed" });
    }
    res.json({ isFraudulent: result.trim() === "True" });
  });
});

module.exports = router;