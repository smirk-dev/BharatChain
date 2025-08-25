# 🇮🇳 BharatChain - User Manual & Setup Guide

<div align="center">

![BharatChain Logo](https://img.shields.io/badge/🇮🇳-BharatChain-blue?style=for-the-badge&labelColor=saffron)

**India's Blockchain-Powered Digital Governance Platform**  
*Complete User Manual & Developer Guide*

[![Frontend](https://img.shields.io/badge/Frontend-Running-brightgreen?style=flat-square)](#quick-start)
[![Backend](https://img.shields.io/badge/Backend-Running-brightgreen?style=flat-square)](#quick-start)
[![AI Service](https://img.shields.io/badge/AI%20Service-Running-brightgreen?style=flat-square)](#quick-start)
[![One-Click Launch](https://img.shields.io/badge/Launch-One%20Click-orange?style=flat-square)](#-quick-start-one-click-launch)

**🚀 [Quick Start](#-quick-start-one-click-launch) • 📱 [User Guide](#-user-guide) • 🔧 [Developer Setup](#-developer-setup) • 🛠️ [Troubleshooting](#-troubleshooting)**

</div>

---

## � **What is BharatChain?**

**BharatChain** is India's first comprehensive blockchain-powered digital governance platform that revolutionizes how citizens interact with government services. Built with cutting-edge technology, it provides:

- **🔐 Secure Document Management** - Upload, verify, and store official documents on blockchain
- **📝 Smart Grievance System** - AI-powered complaint processing with real-time tracking  
- **👤 Digital Identity** - Blockchain-based citizen registration and authentication
- **🤖 AI-Powered Analysis** - Intelligent document verification and grievance categorization
- **🌐 Modern Web Interface** - Beautiful, responsive Indian-themed user interface

### 🎯 **Why BharatChain?**
Transform government services with transparency, security, and efficiency through blockchain technology.

---

## 🚀 **Quick Start - One Click Launch**

### **📋 Prerequisites**
Before starting, ensure you have:
- **Windows 10/11** (our launcher is optimized for Windows)
- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **Python 3.8+** installed ([Download here](https://python.org/))
- **MetaMask Browser Extension** ([Install here](https://metamask.io/))

### **⚡ Instant Launch (Easiest Method)**

**Option 1: Simple Double-Click Launch**
```bash
# Navigate to your BharatChain folder and double-click:
start.bat
```

**Option 2: Enhanced Launcher**
```bash
# Double-click for smart launcher with fallback:
bharatchain.bat
```

**Option 3: PowerShell Advanced**
```powershell
# Right-click folder → "Open PowerShell here" → Run:
.\bharatchain.ps1
```

### **🎬 What Happens When You Launch**

```
========================================
🇮🇳 BharatChain Launcher 🇮🇳
Starting all services...
========================================

✅ Stopping existing services...
🤖 Starting AI Service (Port 5001)...
⚙️ Starting Backend (Port 3001)...
🎨 Starting Frontend (Port 3000)...

========================================
🚀 All services are starting up!

Services run in separate windows.
Please wait 15-20 seconds for startup...

🌐 Your BharatChain will open at:
   http://localhost:3000

📡 Backend API available at:
   http://localhost:3001

🧠 AI Service available at:
   http://localhost:5001
========================================

🔥 Opening browser automatically...
```

### **✅ Verify Everything Works**

After launch, you should see:
- **3 terminal windows** opened (AI Service, Backend, Frontend)
- **Browser opens automatically** to http://localhost:3000
- **Beautiful Indian-themed interface** loads
- **"Connect MetaMask" button** appears on the homepage

### **🛑 To Stop All Services**

```bash
# Method 1: Close terminal windows manually
# Method 2: Use stop command
bharatchain.bat stop

# Method 3: Kill all Node.js processes
taskkill /f /im node.exe
taskkill /f /im python.exe
```

---

## � **User Guide**

### **🔐 Step 1: Connect Your Wallet**

1. **Install MetaMask** browser extension if not already installed
2. **Create/Import wallet** and set up your account
3. **Visit** http://localhost:3000 
4. **Click "Connect MetaMask"** on the homepage
5. **Approve connection** in MetaMask popup
6. **Sign message** to authenticate (no gas fees!)

### **👤 Step 2: Citizen Registration**

1. **After wallet connection**, you'll see the registration form
2. **Fill required details**:
   - Full Name
   - Aadhar Number (12 digits)
   - Phone Number
   - Email Address
   - Date of Birth
3. **Submit registration** - your identity gets stored on blockchain
4. **Success!** You're now a registered BharatChain citizen

### **📄 Step 3: Document Management**

**Upload Documents:**
1. **Navigate to "Documents"** in the dashboard
2. **Click "Upload Document"**
3. **Select file** (PDF, JPG, PNG - max 10MB)
4. **Choose document type** (Aadhar, PAN, etc.)
5. **Wait for AI processing** - automatic text extraction & verification
6. **Document stored** on blockchain with IPFS hash

**View Documents:**
- **Dashboard overview** shows all your documents
- **Click any document** to view details
- **Verification status** shown (Pending/Verified/Rejected)
- **Download original** or processed version

### **📝 Step 4: Submit Grievances**

**File a Complaint:**
1. **Go to "Grievances"** section
2. **Click "Submit New Grievance"**
3. **Fill the form**:
   - **Subject**: Brief description
   - **Description**: Detailed explanation
   - **Category**: Select appropriate category
   - **Urgency**: Select priority level
4. **Submit** - AI automatically analyzes and categorizes
5. **Track status** - real-time updates on progress

**AI Analysis Features:**
- **Sentiment Analysis**: Detects urgency and emotion
- **Smart Categorization**: Auto-assigns to correct department
- **Priority Scoring**: Urgent issues get higher priority
- **Response Time**: Estimated resolution timeline

### **📊 Step 5: Dashboard Overview**

Your dashboard shows:
- **Document Summary**: Total uploaded, verified, pending
- **Grievance Status**: Active, resolved, in-progress
- **Recent Activity**: Latest actions and updates
- **Quick Actions**: Fast access to common tasks
- **Notifications**: Important updates and alerts

---

## � **Developer Setup**

### **🛠️ Manual Development Setup**

If you want to run services individually for development:

**Install Dependencies:**
```bash
# Clone repository
git clone https://github.com/your-username/WHCL-Hackathon.git
cd WHCL-Hackathon

# Install backend dependencies
cd server && npm install

# Install frontend dependencies  
cd ../client && npm install

# Install AI service dependencies
cd ../ai-service && pip install -r requirements.txt
```

**Start Services Manually:**
```bash
# Terminal 1: AI Service
cd ai-service
python simple_app.py

# Terminal 2: Backend
cd server
npm start

# Terminal 3: Frontend
cd client
npm start
```

### **🔗 System Architecture**

| **Component** | **Technology** | **Port** | **Purpose** |
|---------------|---------------|----------|-------------|
| **Frontend** | React 18 + Material-UI | 3000 | User interface & dashboard |
| **Backend** | Node.js + Express | 3001 | RESTful APIs & business logic |
| **AI Service** | Python + Flask | 5001 | Document analysis & ML processing |
| **Database** | SQLite | - | Data persistence & caching |
| **Blockchain** | Local/Mumbai | 8545 | Smart contracts & immutable records |

### **🗃️ Project Structure**

```
WHCL-Hackathon/
├── 🎨 client/                 # React frontend
│   ├── src/components/        # UI components
│   ├── src/context/          # Web3 & app context
│   └── public/               # Static assets
├── ⚙️ server/                 # Node.js backend  
│   ├── routes/               # API endpoints
│   ├── database/             # DB models & config
│   └── server.js             # Main server file
├── 🤖 ai-service/             # Python AI service
│   ├── simple_app.py         # Flask app
│   └── requirements.txt      # Python dependencies
├── 🔗 contracts/             # Smart contracts
│   ├── CitizenRegistry.sol   # Citizen management
│   ├── DocumentRegistry.sol  # Document storage
│   └── GrievanceSystem.sol   # Grievance handling
├── 🚀 Launchers/             # One-click launch files
│   ├── start.bat             # Simple launcher
│   ├── bharatchain.bat       # Enhanced launcher
│   └── bharatchain.ps1       # PowerShell launcher
└── 📚 docs/                  # Documentation
```

---

## 📡 **API Reference**

### **🔐 Authentication Endpoints**

| Method | Endpoint | Description | Example |
|--------|----------|-------------|---------|
| `POST` | `/api/auth/message` | Get wallet signing message | `curl -X POST http://localhost:3001/api/auth/message` |
| `POST` | `/api/auth/connect` | Authenticate with signature | `curl -X POST http://localhost:3001/api/auth/connect -d '{"address":"0x...", "signature":"0x..."}'` |
| `POST` | `/api/auth/verify` | Verify JWT token | `curl -X POST http://localhost:3001/api/auth/verify -H "Authorization: Bearer TOKEN"` |

### **👤 Citizen Management**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/citizens/profile` | Get citizen profile | Requires JWT token |
| `POST` | `/api/citizens/register` | Register new citizen | `fullName, aadharNumber, phoneNumber, email, dateOfBirth` |
| `PUT` | `/api/citizens/update` | Update citizen information | Profile fields to update |

### **📄 Document Management**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/documents` | List citizen documents | Optional: `type`, `status` filters |
| `POST` | `/api/documents/upload` | Upload & analyze document | `file` (multipart), `type`, `description` |
| `GET` | `/api/documents/:id` | Get document details | Document ID |
| `PUT` | `/api/documents/:id/verify` | Verify document (officials) | `status`, `comments` |

### **📝 Grievance System**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/grievances` | List grievances | Optional: `status`, `category` filters |
| `POST` | `/api/grievances` | Submit new grievance | `subject`, `description`, `category`, `urgency` |
| `PUT` | `/api/grievances/:id` | Update grievance status | `status`, `comments` |
| `POST` | `/api/grievances/:id/comments` | Add comment | `comment`, `isOfficial` |

### **🧠 AI Service Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/health` | AI service health check | None |
| `POST` | `/analyze/grievance` | Analyze grievance text | `{"text": "grievance description"}` |
| `POST` | `/analyze/document` | Process document OCR | `file` (multipart form) |
| `POST` | `/analyze/sentiment` | Sentiment analysis | `{"text": "text to analyze"}` |

### **📊 System Health**

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/health` | Overall system health | `{"status": "running", "timestamp": "..."}` |
| `GET` | `/api/health/database` | Database connectivity | `{"database": "connected"}` |
| `GET` | `/api/health/blockchain` | Blockchain connectivity | `{"blockchain": "connected"}` |

---

## 🛠️ **Troubleshooting**

### **🚨 Common Issues & Solutions**

#### **1. Services Won't Start**

**Problem**: "Port already in use" or services fail to start

**Solutions**:
```bash
# Kill existing processes
taskkill /f /im node.exe
taskkill /f /im python.exe

# Then restart
.\start.bat
```

**Problem**: "Module not found" errors

**Solutions**:
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install
cd ../ai-service && pip install -r requirements.txt
```

#### **2. MetaMask Connection Issues**

**Problem**: MetaMask doesn't connect or shows errors

**Solutions**:
- **Check MetaMask is unlocked** and account is selected
- **Refresh the page** (Ctrl+F5) and try again
- **Switch to correct network** (use local network for development)
- **Clear browser cache** and restart browser

#### **3. AI Service Not Working**

**Problem**: AI analysis fails or returns errors

**Solutions**:
```bash
# Check if Python dependencies are installed
cd ai-service
pip install -r requirements.txt

# Check if service is running
curl http://localhost:5001/health

# Restart AI service
python simple_app.py
```

#### **4. Frontend Not Loading**

**Problem**: React app shows blank page or errors

**Solutions**:
```bash
# Clear React cache and restart
cd client
npm start -- --reset-cache

# Or delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

#### **5. Database Issues**

**Problem**: "Database locked" or connection errors

**Solutions**:
```bash
# Stop all services first
taskkill /f /im node.exe

# Delete database lock file
del server\database\*.db-wal
del server\database\*.db-shm

# Restart backend
cd server && npm start
```

### **🔍 Debugging Tips**

#### **Check Service Status**
```bash
# Quick status check
bharatchain.bat status

# Manual health checks
curl http://localhost:3000    # Frontend
curl http://localhost:3001/api/health    # Backend  
curl http://localhost:5001/health        # AI Service
```

#### **View Service Logs**
- **Frontend**: Check browser console (F12 → Console)
- **Backend**: Look at terminal running `npm start` in server folder
- **AI Service**: Check terminal running `python simple_app.py`

#### **Common Error Messages**

| Error | Meaning | Solution |
|-------|---------|----------|
| `EADDRINUSE` | Port already in use | Kill existing processes with `taskkill` |
| `MODULE_NOT_FOUND` | Missing dependencies | Run `npm install` or `pip install -r requirements.txt` |
| `MetaMask not detected` | MetaMask not installed | Install MetaMask browser extension |
| `Connection refused` | Service not running | Start the specific service |
| `CORS error` | Cross-origin request blocked | Check backend CORS configuration |

### **📞 Getting Help**

If you're still having issues:

1. **Check all services are running**: Use `bharatchain.bat status`
2. **Review terminal outputs**: Look for error messages in service windows
3. **Try clean restart**: Stop all services, wait 5 seconds, restart
4. **Check prerequisites**: Ensure Node.js, Python, and MetaMask are installed
5. **Create GitHub issue**: If problem persists, report it with error details

### **🎯 Performance Tips**

- **First startup takes 20-30 seconds** - be patient!
- **Keep terminal windows open** - closing them stops services
- **Use Chrome/Edge browsers** - better MetaMask compatibility
- **Clear browser cache periodically** - prevents stale data issues
- **Restart services daily** - keeps everything fresh during development

---

## 🚀 **Advanced Usage**

### **🔧 Environment Configuration**

Create `.env` file in server folder:
```env
# Database
DATABASE_URL=sqlite:./database/bharatchain.db
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-here
SESSION_SECRET=your-session-secret-here

# Services
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:5001

# Blockchain (for production)
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your-wallet-private-key-for-deployment
```

### **🌐 Production Deployment**

#### **Frontend (Vercel/Netlify)**
```bash
cd client
npm run build
# Deploy dist/ folder to your hosting service
```

#### **Backend (Railway/Render/Heroku)**
```bash
cd server
# Configure environment variables on hosting platform
# Deploy server folder
```

#### **AI Service (PythonAnywhere/Railway)**
```bash
cd ai-service
# Install requirements: pip install -r requirements.txt
# Start with: python simple_app.py
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

### **🔨 Development Setup**
1. **Fork the repository** on GitHub
2. **Clone your fork**: `git clone https://github.com/your-username/WHCL-Hackathon.git`
3. **Create feature branch**: `git checkout -b feature/amazing-feature`
4. **Make changes** and test thoroughly
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**

### **📝 Contribution Guidelines**
- **Write tests** for new features
- **Follow existing code style**
- **Update documentation** for API changes
- **Test on Windows** (our primary platform)
- **Include screenshots** for UI changes

### **🧪 Testing Your Changes**
```bash
# Run all tests
npm test                    # Backend tests
cd client && npm test       # Frontend tests  
cd ai-service && python -m pytest  # AI service tests

# Manual testing
.\start.bat                 # Test launcher
bharatchain.bat status      # Test status check
```

---

## 📄 **License & Acknowledgments**

### **📜 License**
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **🙏 Acknowledgments**
- **Government of India** - Digital India Initiative inspiration
- **Ethereum Foundation** - Blockchain infrastructure
- **OpenZeppelin** - Smart contract security standards
- **Material-UI Team** - Beautiful React component library
- **MetaMask Team** - Web3 wallet integration
- **Flask & React Communities** - Excellent documentation and support

### **🌟 Built With Love For**
- **Digital India** 🇮🇳
- **Transparent Governance** 🏛️
- **Citizen Empowerment** 👥
- **Blockchain Innovation** ⛓️

---

<div align="center">

**🇮🇳 Made with ❤️ for Digital India 🇮🇳**

[![One-Click Launch](https://img.shields.io/badge/Launch-start.bat-orange?style=for-the-badge)](start.bat)
[![Documentation](https://img.shields.io/badge/Docs-Complete-green?style=for-the-badge)](#-user-guide)
[![Support](https://img.shields.io/badge/Support-24%2F7-blue?style=for-the-badge)](#-troubleshooting)

**Ready to revolutionize digital governance? Just double-click `start.bat` and let's go! 🚀**

*Transform India's digital future, one blockchain transaction at a time.* ✨

</div>

---

## 📞 **Support & Contact**

- **📧 Email**: support@bharatchain.gov.in
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-username/WHCL-Hackathon/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/your-username/WHCL-Hackathon/issues)
- **📚 Documentation**: Complete user manual above
- **🚀 Quick Start**: Just run `start.bat` or `bharatchain.bat`

**Happy coding! 🎉 Let's build the future of digital governance together! 🇮🇳**
