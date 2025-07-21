// File: server/routes/upload.js
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const data = new FormData();
  data.append("file", fs.createReadStream(file.path));

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: "Infinity",
        headers: {
          ...data.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    fs.unlinkSync(file.path); // Clean up local file
    res.status(200).json({ IpfsHash: response.data.IpfsHash });
  } catch (error) {
    console.error("IPFS upload error:", error.message);
    res.status(500).json({ error: "IPFS upload failed" });
  }
});

module.exports = router;
