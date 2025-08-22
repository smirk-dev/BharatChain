# 🚀 BharatChain Mumbai Testnet Deployment Guide

## Prerequisites

1. **MetaMask Wallet** with Mumbai Network added
2. **Test MATIC tokens** for gas fees

## Step 1: Setup Mumbai Network in MetaMask

Add Mumbai Testnet to MetaMask:
- **Network Name:** Mumbai Testnet
- **RPC URL:** https://rpc-mumbai.maticvigil.com
- **Chain ID:** 80001
- **Currency Symbol:** MATIC
- **Block Explorer:** https://mumbai.polygonscan.com

## Step 2: Get Test MATIC Tokens

1. Visit: https://faucet.polygon.technology/
2. Select Mumbai Network
3. Enter your wallet address
4. Request 0.2 MATIC tokens

## Step 3: Configure Environment

1. Create a new MetaMask account or use existing
2. Export private key from MetaMask (KEEP SECURE!)
3. Update `.env` file:

```bash
PRIVATE_KEY=your_metamask_private_key_here
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

## Step 4: Deploy to Mumbai Testnet

```bash
# Deploy contracts to Mumbai
npx hardhat run scripts/deploy.js --network mumbai

# Verify contracts (optional)
npx hardhat verify CONTRACT_ADDRESS --network mumbai
```

## Step 5: Update Frontend Configuration

After deployment, update `client/.env`:

```bash
REACT_APP_BLOCKCHAIN_NETWORK=mumbai
REACT_APP_BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
REACT_APP_CITIZEN_REGISTRY_ADDRESS=deployed_address_here
REACT_APP_DOCUMENT_REGISTRY_ADDRESS=deployed_address_here
REACT_APP_GRIEVANCE_SYSTEM_ADDRESS=deployed_address_here
```

## Step 6: Start Application

```bash
# Start backend
cd server && npm run dev

# Start frontend (new terminal)
cd client && npm start
```

## Important Notes

- **Never commit private keys to git**
- **Use environment variables for sensitive data**
- **Mumbai is a testnet - transactions are free but not real**
- **Keep private keys secure and never share them**

## Troubleshooting

### Common Issues:

1. **Insufficient funds:** Get more test MATIC from faucet
2. **Network issues:** Try alternative RPC: `https://polygon-mumbai.g.alchemy.com/v2/demo`
3. **Gas estimation failed:** Increase gas limit in hardhat.config.js

### Gas Estimation Issues:
```javascript
// In hardhat.config.js, mumbai network section:
mumbai: {
  url: process.env.MUMBAI_RPC_URL,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 80001,
  gas: 6000000,
  gasPrice: 1000000000, // 1 gwei
},
```

## Next Steps After Deployment

1. Test citizen registration with MetaMask
2. Verify smart contract interactions
3. Deploy backend to cloud service (Render, Railway, etc.)
4. Deploy frontend to Vercel/Netlify
5. Update contract addresses in production environment

---

🎉 **Your BharatChain is now live on Mumbai Testnet!**
