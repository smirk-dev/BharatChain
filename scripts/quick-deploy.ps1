# 🚀 BharatChain Quick Deploy Script

echo "🔥 BharatChain Mumbai Testnet Deployment"
echo "========================================"

# Wallet details
$WALLET_ADDRESS = "0x57b79068cd3fC85b6F17aF4f0Ab7b102A8A013bF"
$PRIVATE_KEY = "0x44ad0655ab46a80b40e7f40bb4e1e11edd539f4f6f713b82f66b5e14f4fe91f1"

echo ""
echo "📋 Deployment Wallet:"
echo "Address: $WALLET_ADDRESS"
echo "Network: Mumbai Testnet (Chain ID: 80001)"
echo ""

echo "💰 Getting Test MATIC Tokens..."
echo "Please visit: https://faucet.polygon.technology/"
echo "Enter wallet address: $WALLET_ADDRESS"
echo "Select Mumbai network and request 0.2 MATIC"
echo ""

# Pause for user to get tokens
Read-Host "Press Enter after getting test MATIC tokens..."

echo ""
echo "🔍 Checking wallet balance..."
try {
    $balance = & npx hardhat run scripts/check-balance.js --network mumbai
    echo $balance
} catch {
    echo "⚠️  Could not check balance, proceeding with deployment..."
}

echo ""
echo "🚀 Deploying contracts to Mumbai testnet..."
try {
    & npx hardhat run scripts/deploy.js --network mumbai
    echo "✅ Deployment completed successfully!"
} catch {
    echo "❌ Deployment failed: $($_.Exception.Message)"
    exit 1
}

echo ""
echo "🎉 BharatChain is now live on Mumbai Testnet!"
echo ""
echo "📱 Next Steps:"
echo "1. Start backend: cd server && npm run dev"
echo "2. Start frontend: cd client && npm start"
echo "3. Add Mumbai network to MetaMask"
echo "4. Import wallet to MetaMask using private key"
echo "5. Access BharatChain at http://localhost:3000"
echo ""
echo "🔗 Mumbai Network Details:"
echo "RPC URL: https://polygon-mumbai.g.alchemy.com/v2/demo"
echo "Chain ID: 80001"
echo "Currency: MATIC"
echo "Explorer: https://mumbai.polygonscan.com/"
