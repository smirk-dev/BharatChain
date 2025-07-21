// File: scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  
  await registry.deployed();
  console.log("DocumentRegistry deployed to:", registry.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });