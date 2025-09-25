# 🇮🇳 BharatChain - One Command Launcher 🚀

## ✨ **The Simplest Way to Start BharatChain**

Instead of managing 3 different terminals and complex commands, now you can start the entire BharatChain ecosystem with **ONE SIMPLE COMMAND**!

---

## 🎯 **Quick Start (Windows)**

### **Method 1: Double-Click (Easiest)**
Just double-click on `bharatchain.bat` in the project folder!

### **Method 2: PowerShell**
```powershell
.\bharatchain.ps1
```

### **Method 3: Command Prompt**
```cmd
bharatchain.bat
```

---

## 🐧 **Quick Start (Linux/MacOS)**

```bash
./bharatchain.sh
```

---

## 📋 **Available Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `bharatchain` | Start all services | `.\bharatchain.ps1` |
| `bharatchain -Status` | Check services status | `.\bharatchain.ps1 -Status` |
| `bharatchain -Stop` | Stop all services | `.\bharatchain.ps1 -Stop` |
| `bharatchain -Logs` | View service logs | `.\bharatchain.ps1 -Logs` |
| `bharatchain -Clean` | Clean restart | `.\bharatchain.ps1 -Clean` |
| `bharatchain -Help` | Show help | `.\bharatchain.ps1 -Help` |

---

## 🌟 **What This Does**

The launcher automatically:

1. **🧹 Cleans** any existing processes
2. **🧠 Starts AI Service** (Python) on port 5001
3. **⚙️ Starts Backend** (Node.js) on port 3001  
4. **🎨 Starts Frontend** (React) on port 3000
5. **🔍 Checks** all services are running
6. **🌐 Opens** your browser to http://localhost:3000

---

## 🎨 **Beautiful CLI Interface**

```
╔══════════════════════════════════════════════════════════════════════╗
║                          🇮🇳 BharatChain 🇮🇳                          ║
║                    Digital Identity Platform                         ║
║                                                                      ║
║  🚀 One Command to Rule Them All - Beautiful CLI Interface 🚀      ║
╚══════════════════════════════════════════════════════════════════════╝

🚀 STARTING BHARATCHAIN ECOSYSTEM...

🧠 Starting AI Service (Python - Port 5001)...
⚙️ Starting Backend (Node.js - Port 3001)...
🎨 Starting Frontend (React - Port 3000)...

🔄 Loading: [████████████████████] 100%

🔍 CHECKING BHARATCHAIN SERVICES STATUS...

🎨 Frontend (React):      ✅ Running
⚙️ Backend (Node.js):     ✅ Running
🧠 AI Service (Python):   ✅ Running

🎉 ALL SERVICES ARE RUNNING PERFECTLY!
🌐 Open: http://localhost:3000
```

---

## ⚡ **Features**

### **🎯 Smart Process Management**
- Automatically kills conflicting processes
- Starts services in the correct order
- Waits for proper initialization

### **🔍 Health Monitoring**
- Real-time service status checking
- Automatic browser opening when ready
- Beautiful progress indicators

### **🪟 Window Management**
- Services run in minimized windows
- Easy access to logs and status
- Clean termination of all processes

### **🛠️ Developer Friendly**
- Color-coded output
- Detailed error messages
- Multiple platform support (Windows/Linux/MacOS)

---

## 🚨 **Troubleshooting**

### **If Services Don't Start:**
1. Run `.\bharatchain.ps1 -Clean` for a fresh restart
2. Check if ports 3000, 3001, 5001 are available
3. Ensure all dependencies are installed

### **If Browser Doesn't Open:**
- Manually visit: http://localhost:3000
- Check firewall settings
- Try `.\bharatchain.ps1 -Status` to verify services

### **Permission Issues (Windows):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎊 **That's It!**

You now have the **world's simplest way** to start your BharatChain project:

```bash
# Windows
.\bharatchain.ps1

# Linux/MacOS  
./bharatchain.sh

# Or just double-click bharatchain.bat on Windows!
```

**No more complex terminal commands, no more managing multiple windows, no more headaches!** 

🇮🇳 **Welcome to the future of easy project management with BharatChain!** 🚀

---

## 🔗 **Links**

- 🎨 **Frontend**: http://localhost:3000
- ⚙️ **Backend API**: http://localhost:3001/api
- 🧠 **AI Service**: http://localhost:5001
- 📚 **Documentation**: Coming soon!

Made with ❤️ by the BharatChain Team
