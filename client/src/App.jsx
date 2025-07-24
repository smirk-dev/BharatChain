import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Check for MetaMask
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is available!');
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        console.log('Wallet connected!');
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask to use this application');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading BharatChain...</h2>
          <p>Decentralized Governance Platform</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>🇮🇳 BharatChain</h1>
            <p>Decentralized Governance & Citizen Record System</p>
            
            {!isConnected ? (
              <button className="connect-button" onClick={connectWallet}>
                Connect Wallet
              </button>
            ) : (
              <div className="connected-status">
                <span className="status-indicator">🟢</span>
                Wallet Connected
              </div>
            )}
          </div>
        </header>

        <main className="App-main">
          <div className="bharatchain-container">
            <section className="hero-section">
              <h2>Welcome to Digital India 2.0</h2>
              <p>
                Experience transparent, secure, and efficient government services 
                powered by blockchain technology.
              </p>
              
              <div className="features-grid">
                <div className="feature-card">
                  <h3>📄 Digital Documents</h3>
                  <p>Secure, verifiable document storage on blockchain</p>
                </div>
                
                <div className="feature-card">
                  <h3>🗳️ Citizen Grievances</h3>
                  <p>Transparent grievance management system</p>
                </div>
                
                <div className="feature-card">
                  <h3>🔐 Identity Verification</h3>
                  <p>Blockchain-based citizen identity management</p>
                </div>
                
                <div className="feature-card">
                  <h3>🤖 AI-Powered</h3>
                  <p>Intelligent document processing and fraud detection</p>
                </div>
              </div>
            </section>
            
            <section className="status-section">
              <h3>System Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span>Blockchain Network:</span>
                  <span className="status-active">🟢 Active</span>
                </div>
                <div className="status-item">
                  <span>IPFS Storage:</span>
                  <span className="status-active">🟢 Online</span>
                </div>
                <div className="status-item">
                  <span>AI Services:</span>
                  <span className="status-active">🟢 Running</span>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="App-footer">
          <p>Built with ❤️ for Digital India | BharatChain v1.0.0</p>
        </footer>
      </div>

      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* Other routes can be added here */}
      </Routes>
    </Router>
  );
}

export default App;
