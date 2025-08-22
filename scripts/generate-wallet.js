const { ethers } = require('ethers');

// Generate a new wallet for testnet
const wallet = ethers.Wallet.createRandom();

console.log('🔐 New Testnet Wallet Generated');
console.log('================================');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('- This is for TESTNET ONLY');
console.log('- Never use this wallet on mainnet');
console.log('- Never commit private keys to git');
console.log('- Store private key securely');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Copy the private key to your .env file');
console.log('2. Get test MATIC from: https://faucet.polygon.technology/');
console.log('3. Add Mumbai network to MetaMask');
console.log('4. Import this wallet to MetaMask using the private key');
console.log('5. Deploy contracts with: npx hardhat run scripts/deploy.js --network mumbai');
