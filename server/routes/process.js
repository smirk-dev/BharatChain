// File: server/routes/process.js
const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");

router.post("/analyze", async (req, res) => {
  const { text } = req.body;
  
  const pythonProcess = spawn("python", ["./ml-models/sentiment_analysis.py", text]);
  
  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Analysis failed" });
    }
    res.json(JSON.parse(result));
  });
});

module.exports = router;