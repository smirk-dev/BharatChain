const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting BharatChain Smart Contract Deployment');
  console.log('================================================');
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log('\n📊 Deployment Information:');
  console.log('- Network:', network.name, `(Chain ID: ${network.chainId})`);
  console.log('- Deployer:', await deployer.getAddress());
  console.log('- Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  const deployedContracts = {};

  try {
    // Deploy CitizenRegistry
    console.log('\n1️⃣ Deploying CitizenRegistry...');
    const CitizenRegistry = await ethers.getContractFactory('CitizenRegistry');
    const citizenRegistry = await CitizenRegistry.deploy();
    await citizenRegistry.waitForDeployment();
    
    const citizenRegistryAddress = await citizenRegistry.getAddress();
    deployedContracts.CitizenRegistry = {
      address: citizenRegistryAddress,
      transactionHash: citizenRegistry.deploymentTransaction().hash,
      gasUsed: (await citizenRegistry.deploymentTransaction().wait()).gasUsed.toString(),
    };
    
    console.log('✅ CitizenRegistry deployed to:', citizenRegistryAddress);

    // Deploy DocumentRegistry
    console.log('\n2️⃣ Deploying DocumentRegistry...');
    const DocumentRegistry = await ethers.getContractFactory('DocumentRegistry');
    const documentRegistry = await DocumentRegistry.deploy(citizenRegistryAddress);
    await documentRegistry.waitForDeployment();
    
    const documentRegistryAddress = await documentRegistry.getAddress();
    deployedContracts.DocumentRegistry = {
      address: documentRegistryAddress,
      transactionHash: documentRegistry.deploymentTransaction().hash,
      gasUsed: (await documentRegistry.deploymentTransaction().wait()).gasUsed.toString(),
    };
    
    console.log('✅ DocumentRegistry deployed to:', documentRegistryAddress);

    // Deploy GrievanceSystem
    console.log('\n3️⃣ Deploying GrievanceSystem...');
    const GrievanceSystem = await ethers.getContractFactory('GrievanceSystem');
    const grievanceSystem = await GrievanceSystem.deploy(citizenRegistryAddress);
    await grievanceSystem.waitForDeployment();
    
    const grievanceSystemAddress = await grievanceSystem.getAddress();
    deployedContracts.GrievanceSystem = {
      address: grievanceSystemAddress,
      transactionHash: grievanceSystem.deploymentTransaction().hash,
      gasUsed: (await grievanceSystem.deploymentTransaction().wait()).gasUsed.toString(),
    };
    
    console.log('✅ GrievanceSystem deployed to:', grievanceSystemAddress);

    // Initialize contracts with default permissions
    console.log('\n4️⃣ Initializing contract permissions...');
    
    // Add deployer as default verifier
    await citizenRegistry.addVerifier(deployer.getAddress(), 'System Administrator');
    console.log('✅ Default verifier added');

    // Authorize deployer as document issuer
    await documentRegistry.authorizeIssuer(deployer.getAddress(), 'Government Authority');
    console.log('✅ Default document issuer authorized');

    // Authorize deployer as grievance officer
    await grievanceSystem.authorizeOfficer(deployer.getAddress(), 'Administrative Department');
    console.log('✅ Default grievance officer authorized');

    // Save deployment information
    const deploymentInfo = {
      network: {
        name: network.name,
        chainId: network.chainId,
      },
      deployer: deployer.getAddress(),
      deploymentDate: new Date().toISOString(),
      contracts: deployedContracts,
      initialization: {
        defaultVerifier: deployer.getAddress(),
        defaultIssuer: deployer.getAddress(),
        defaultOfficer: deployer.getAddress(),
      },
    };

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Save deployment file
    const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to:', deploymentFile);

    // Update contract addresses in environment files
    updateEnvironmentFiles(deployedContracts);

    // Generate contract artifacts for frontend
    generateContractArtifacts();

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- CitizenRegistry:', deployedContracts.CitizenRegistry.getAddress());
    console.log('- DocumentRegistry:', deployedContracts.DocumentRegistry.getAddress());
    console.log('- GrievanceSystem:', deployedContracts.GrievanceSystem.getAddress());
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Update your environment files with the new contract addresses');
    console.log('2. Start your backend server: cd server && npm run dev');
    console.log('3. Start your frontend: cd client && npm start');
    console.log('4. Access BharatChain at http://localhost:3000');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    throw error;
  }
}

function updateEnvironmentFiles(contracts) {
  console.log('\n5️⃣ Updating environment files...');
  
  const envFiles = [
    { path: '../client/.env', prefix: 'REACT_APP_' },
    { path: '../server/.env', prefix: '' },
    { path: '../.env', prefix: '' },
  ];

  envFiles.forEach(({ path: envPath, prefix }) => {
    const fullPath = path.join(__dirname, envPath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      Object.entries(contracts).forEach(([name, info]) => {
        const key = `${prefix}${name.toUpperCase()}_ADDRESS`;
        const regex = new RegExp(`${key}=.*`, 'g');
        const replacement = `${key}=${info.getAddress()}`;
        
        if (content.includes(key)) {
          content = content.replace(regex, replacement);
        } else {
          content += `\n${replacement}`;
        }
      });
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${envPath}`);
    }
  });
}

function generateContractArtifacts() {
  console.log('\n6️⃣ Generating contract artifacts for frontend...');
  
  const artifactsDir = path.join(__dirname, '../artifacts/contracts');
  const clientContractsDir = path.join(__dirname, '../client/src/contracts');
  
  if (!fs.existsSync(clientContractsDir)) {
    fs.mkdirSync(clientContractsDir, { recursive: true });
  }

  const contracts = ['CitizenRegistry', 'DocumentRegistry', 'GrievanceSystem'];
  
  contracts.forEach(contractName => {
    const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);
    const targetPath = path.join(clientContractsDir, `${contractName}.json`);
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const contractData = {
        abi: artifact.abi,
        bytecode: artifact.bytecode,
      };
      
      fs.writeFileSync(targetPath, JSON.stringify(contractData, null, 2));
      console.log(`✅ Generated ${contractName}.json for frontend`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
