const { ethers } = require('hardhat');

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    
    console.log('Wallet Address:', deployer.address);
    console.log('Balance:', ethers.formatEther(balance), 'MATIC');
    
    if (balance < ethers.parseEther('0.01')) {
      console.log('⚠️  Low balance! Get more test MATIC from https://faucet.polygon.technology/');
    } else {
      console.log('✅ Sufficient balance for deployment');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
