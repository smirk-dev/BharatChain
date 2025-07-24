# BharatChain

A comprehensive **blockchain-based platform** to revolutionize governance and citizen services in India.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [API Usage](#api-usage)
- [Smart Contracts](#smart-contracts)
- [Frontend Guide](#frontend-guide)
- [AI/ML Services](#aiml-services)
- [Deployment Guide](#deployment-guide)
- [Security Guidelines](#security-guidelines)
- [SDKs and Libraries](#sdks-and-libraries)
- [License](#license)
- [Support](#support)

## Overview

**BharatChain** provides a secure, decentralized digital governance platform for citizen services, digital identity, document management, and real-time benefit delivery. The platform leverages blockchain, AI, and modern web technologies to ensure transparency, efficiency, and security for citizens and government agencies alike[1].

## Key Features

- **Citizen Services**
  - Blockchain-based digital identity management
  - Secure, decentralized document storage with IPFS
  - Real-time notifications for document and service updates

- **Document Management**
  - AI-powered document verification and fraud detection
  - Supports images (JPEG, PNG) and PDFs
  - Immutable blockchain records and full version control

- **Grievance Redressal**
  - AI-driven grievance categorization and smart routing
  - Real-time progress tracking and sentiment analysis
  - Officer dashboards with performance analytics

- **Security**
  - Wallet-based authentication and 2FA
  - End-to-end encryption
  - Full audit trails and granular, role-based access control

## System Architecture

| Layer              | Technologies                        | Role                                        |
|--------------------|-------------------------------------|---------------------------------------------|
| Frontend           | React                               | Dashboard, Document UI, Grievances          |
| API                | Node.js, REST, WebSocket            | Auth, Document, Grievance services          |
| Blockchain         | Ethereum, Web3, IPFS                | Registration, Document notarization         |
| Database           | PostgreSQL, Redis                   | User/Doc/Grievance data, caching            |
| AI/ML Services     | Python (OCR, Classification, Fraud) | Document analysis, sentiment, smart routing |

## Getting Started

### Prerequisites

- **Node.js** v16+ (recommended v18+)
- **Python** v3.8+ (recommended v3.10+)
- **PostgreSQL** v12+ (recommended v14+)
- **Redis** v6+ (recommended v7+)
- **4GB RAM, 10GB disk** (recommended 8GB RAM, 50GB disk for IPFS)

### Setup

```bash
git clone https://github.com/smirk-dev/WHCL-Hackathon.git
cd WHCL-Hackathon
chmod +x scripts/setup.sh
./scripts/setup.sh
cp .env.example .env
# Edit .env as needed
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000
- **Blockchain (local/dev):** http://localhost:8545

## API Usage

**Base URL:** `https://api.bharatchain.example.com/api`

### Authentication

POST `/auth/connect`  
Authenticate with wallet signature for JWT token access.

### Citizen Profile

- **GET /citizens/profile:** Retrieve profile  
- **PUT /citizens/profile:** Update profile

### Document Management

- **POST /documents/upload:**  
  Upload JPEG, PNG, or PDF. Can specify `documentType`.

- **GET /documents:**  
  List uploaded/verified documents (with status, IPFS hash).

### Grievance System

- **POST /grievances:**  
  Submit a new grievance (`title`, `description`, `category`, `priority`).

- **GET /grievances:**  
  View all grievances, with filtering and pagination.

### WebSocket Events

- Real-time document verification
- Grievance status updates

### Error Responses

Standardized JSON error format with codes like `INVALID_TOKEN`, `ACCESS_DENIED`, `RESOURCE_NOT_FOUND`.

### Rate Limits

- **General API:** 100 requests/15min per IP
- **File Upload:** 10/hour per user
- **Grievance Submission:** 5/day per user

## Smart Contracts

- Blockchain-based citizen registration and document notarization
- Interfaces with Ethereum (testnet/mainnet configurable)
- Ensures immutable, auditable records for identity and documents

## Frontend Guide

- Built with React
- Dashboard for citizens and officials
- Document UI for upload, status tracking, and version history
- Grievance management and analytics

## AI/ML Services

- OCR and intelligent document processing
- Automated classification (Aadhaar, PAN, Voter ID, etc.)
- Fraud detection and sentiment analysis for grievances

## Deployment Guide

- See `scripts/setup.sh` and `docs/deployment.md`
- Supports containerized and cloud deployment
- .env-based configuration for environment variables

## Security Guidelines

- End-to-end encryption and wallet authentication
- Multi-layer authentication flows and audit trails
- Per-role access restrictions

## SDKs and Libraries

- **JavaScript/TypeScript:**  
  `npm install @bharatchain/js-sdk`
- **Python:**  
  `pip install bharatchain-python`

#### Example (JS)

```js
import BharatChain from '@bharatchain/js-sdk';

const bc = new BharatChain({ apiUrl: 'https://api.bharatchain.example.com', apiKey: 'your-api-key' });
const result = await bc.documents.upload({ file: documentFile, type: 'aadhar' });
console.log('Document uploaded:', result.documentId);
```

## License

MIT License. See [LICENSE](LICENSE) file for details.

## Support

- **Discord:** BharatChain Community
- **Live Demo:** https://bharatchain.example.com
- **API Docs:** docs.bharatchain.example.com
- **Issues:** Use GitHub issues to report bugs and feature requests

**Built with ❤️ for Digital India 🇮🇳**[1]

[1] https://github.com/smirk-dev/WHCL-Hackathon
