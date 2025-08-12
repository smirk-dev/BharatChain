const { ethers } = require('hardhat');

async function main() {
  console.log('🧪 Testing deployment connection...');
  
  try {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log('✅ Network:', network.name);
    console.log('✅ Chain ID:', network.chainId.toString());
    console.log('✅ Deployer:', await deployer.getAddress());
    
    // Simple contract deployment test
    console.log('\n📝 Deploying CitizenRegistry...');
    const CitizenRegistry = await ethers.getContractFactory('CitizenRegistry');
    const citizenRegistry = await CitizenRegistry.deploy();
    await citizenRegistry.waitForDeployment();
    
    const address = await citizenRegistry.getAddress();
    console.log('✅ CitizenRegistry deployed to:', address);
    
    // Update .env with the address
    const fs = require('fs');
    const envPath = '.env';
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/CITIZEN_REGISTRY_ADDRESS=.*/, `CITIZEN_REGISTRY_ADDRESS=${address}`);
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env with contract address');
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
