# BharatChain Documentation

## Overview

BharatChain is a comprehensive blockchain-based platform designed to revolutionize governance and citizen services in India. This documentation provides detailed information about the system architecture, API endpoints, deployment procedures, and usage guidelines.

## Table of Contents

1. [Getting Started](./getting-started.md)
2. [System Architecture](./architecture.md)
3. [API Documentation](./api/README.md)
4. [Smart Contracts](./contracts/README.md)
5. [Frontend Guide](./frontend/README.md)
6. [AI/ML Services](./ai-ml/README.md)
7. [Deployment Guide](./deployment/README.md)
8. [Security Guidelines](./security/README.md)
9. [Contributing](./contributing.md)
10. [FAQ](./faq.md)

## Quick Links

- **Live Demo**: [https://bharatchain.example.com](https://bharatchain.example.com)
- **API Base URL**: `https://api.bharatchain.example.com`
- **GitHub Repository**: [https://github.com/smirk-dev/WHCL-Hackathon](https://github.com/smirk-dev/WHCL-Hackathon)
- **Issue Tracker**: [GitHub Issues](https://github.com/smirk-dev/WHCL-Hackathon/issues)

## System Requirements

### Minimum Requirements
- **Node.js**: v16.0.0 or higher
- **Python**: v3.8 or higher
- **PostgreSQL**: v12 or higher
- **Redis**: v6 or higher
- **Memory**: 4GB RAM
- **Storage**: 10GB available space

### Recommended Requirements
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v7 or higher
- **Memory**: 8GB RAM
- **Storage**: 50GB available space (for IPFS and document storage)

## Key Features

### 🏛️ **Citizen Services**
- **Digital Identity Management**: Blockchain-based citizen registration and verification
- **Document Storage**: Secure, decentralized document storage using IPFS
- **Service Access**: Streamlined access to government services
- **Real-time Updates**: Live notifications for document status and service updates

### 📋 **Document Management**
- **AI-Powered Verification**: Automated document classification and fraud detection
- **Multi-format Support**: Support for images (JPEG, PNG) and PDFs
- **Blockchain Integrity**: Immutable document records on blockchain
- **Version Control**: Track document updates and revisions

### 🗳️ **Grievance System**
- **Smart Routing**: AI-powered grievance categorization and routing
- **Sentiment Analysis**: Automatic sentiment analysis of citizen feedback
- **Progress Tracking**: Real-time grievance status updates
- **Performance Analytics**: Dashboard for government officials

### 🔐 **Security Features**
- **Multi-layer Authentication**: Wallet-based authentication with 2FA
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Trails**: Comprehensive logging of all system activities
- **Role-based Access**: Granular permission system for different user types

## Architecture Overview

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ React Frontend │ │ Node.js API │ │ Smart Contracts│
│ │◄──►│ │◄──►│ │
│ - Dashboard │ │ - RESTful API │ │ - Citizen Reg. │
│ - Document UI │ │ - WebSocket │ │ - Documents │
│ - Grievances │ │ - Auth Service │ │ - Grievances │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│ │
┌─────────────────┐ ┌─────────────────┐
│ PostgreSQL │ │ Blockchain │
│ │ │ │
│ - User Data │ │ - Ethereum │
│ - Documents │ │ - IPFS │
│ - Grievances │ │ - Web3 │
└─────────────────┘ └─────────────────┘
│
┌─────────────────┐
│ AI/ML Services│
│ │
│ - OCR │
│ - Classification│
│ - Fraud Detection│
└─────────────────┘

text

## Quick Start

### 1. Clone Repository
git clone https://github.com/smirk-dev/WHCL-Hackathon.git
cd WHCL-Hackathon

text

### 2. Install Dependencies
chmod +x scripts/setup.sh
./scripts/setup.sh

text

### 3. Configure Environment
cp .env.example .env

Edit .env with your configuration
text

### 4. Start Development Server
npm run dev

text

### 5. Access Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Blockchain**: http://localhost:8545

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

For support and questions:
- **Email**: support@bharatchain.example.com
- **Discord**: [BharatChain Community](https://discord.gg/bharatchain)
- **Documentation**: [docs.bharatchain.example.com](https://docs.bharatchain.example.com)

---

**Built with ❤️ for Digital India 🇮🇳**
docs/api/README.md
text
# BharatChain API Documentation

## Base URL
https://api.bharatchain.example.com/api

text

## Authentication

All API endpoints require authentication via JWT tokens obtained through wallet connection.

### Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json

text

## Endpoints

### Authentication

#### POST /auth/connect
Connect wallet and obtain JWT token.

**Request Body:**
{
"address": "0x742d35Cc...",
"signature": "0x1234...",
"message": "Sign this message to authenticate"
}

text

**Response:**
{
"success": true,
"data": {
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"user": {
"address": "0x742d35Cc...",
"name": "John Doe",
"isVerified": true
}
}
}

text

### Citizens

#### GET /citizens/profile
Get current citizen profile.

**Response:**
{
"success": true,
"data": {
"address": "0x742d35Cc...",
"name": "John Doe",
"email": "john@example.com",
"phone": "+91-9876543210",
"isVerified": true,
"registrationDate": "2024-01-15T10:30:00Z"
}
}

text

#### PUT /citizens/profile
Update citizen profile.

**Request Body:**
{
"name": "Updated Name",
"email": "updated@example.com",
"phone": "+91-9876543210"
}

text

### Documents

#### POST /documents/upload
Upload a new document.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `document`: File (image or PDF)
  - `documentType`: String (aadhar, pan, voter_id, etc.)
  - `expiryDate`: ISO date string (optional)

**Response:**
{
"success": true,
"message": "Document uploaded successfully",
"data": {
"documentId": "0x1234...",
"ipfsHash": "QmX7Y8Z...",
"aiAnalysis": {
"confidence": 0.92,
"documentType": "aadhar",
"isValid": true
}
}
}

text

#### GET /documents
Get all documents for current citizen.

**Response:**
{
"success": true,
"data": [
{
"id": "0x1234...",
"documentType": "aadhar",
"status": "verified",
"uploadDate": "2024-01-15T10:30:00Z",
"ipfsHash": "QmX7Y8Z..."
}
]
}

text

### Grievances

#### POST /grievances
Submit a new grievance.

**Request Body:**
{
"title": "Road Repair Request",
"description": "Multiple potholes on Main Street need repair",
"category": "Infrastructure",
"priority": "medium"
}

text

**Response:**
{
"success": true,
"data": {
"grievanceId": 12345,
"title": "Road Repair Request",
"status": "open",
"createdDate": "2024-01-15T10:30:00Z"
}
}

text

#### GET /grievances
Get all grievances for current citizen.

**Query Parameters:**
- `status`: Filter by status (open, in_progress, resolved, closed)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
{
"success": true,
"data": {
"grievances": [
{
"grievanceId": 12345,
"title": "Road Repair Request",
"status": "in_progress",
"priority": "medium",
"createdDate": "2024-01-15T10:30:00Z",
"updatedDate": "2024-01-16T14:20:00Z"
}
],
"pagination": {
"currentPage": 1,
"totalPages": 3,
"totalItems": 25
}
}
}

text

## Error Responses

All endpoints return errors in the following format:

{
"success": false,
"message": "Error description",
"error": "Detailed error information",
"code": "ERROR_CODE"
}

text

### Common Error Codes

- `INVALID_TOKEN`: Authentication token is invalid or expired
- `ACCESS_DENIED`: Insufficient permissions for requested action
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window
- `INTERNAL_ERROR`: Server-side error occurred

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user
- **Grievance Submission**: 5 submissions per day per user

## WebSocket Events

Connect to `/socket.io` for real-time updates.

### Events

#### document-verified
Emitted when a document is verified.
{
"documentId": "0x1234...",
"status": "verified",
"verifiedBy": "0x5678...",
"timestamp": "2024-01-15T10:30:00Z"
}

text

#### grievance-updated
Emitted when grievance status changes.
{
"grievanceId": 12345,
"status": "in_progress",
"assignedTo": "0x9abc...",
"timestamp": "2024-01-15T10:30:00Z"
}

text

## SDKs and Libraries

### JavaScript/TypeScript
npm install @bharatchain/js-sdk

text

### Python
pip install bharatchain-python

text

### Example Usage (JavaScript)
import BharatChain from '@bharatchain/js-sdk';

const bc = new BharatChain({
apiUrl: 'https://api.bharatchain.example.com',
apiKey: 'your-api-key'
});

// Upload document
const result = await bc.documents.upload({
file: documentFile,
type: 'aadhar'
});

console.log('Document uploaded:', result.documentId);

text
undefined