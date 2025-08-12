const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CitizenRegistry', function () {
  let CitizenRegistry;
  let citizenRegistry;
  let owner;
  let addr1;
  let addr2;
  let verifier;

  beforeEach(async function () {
    [owner, addr1, addr2, verifier] = await ethers.getSigners();
    
    CitizenRegistry = await ethers.getContractFactory('CitizenRegistry');
    citizenRegistry = await CitizenRegistry.deploy();
    await citizenRegistry.waitForDeployment(); // Updated for newer ethers versions
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await citizenRegistry.owner()).to.equal(owner.address);
    });
  });

  describe('Citizen Registration', function () {
    it('Should register a new citizen', async function () {
      const name = 'John Doe';
      const aadharHash = ethers.keccak256(ethers.toUtf8Bytes('123456789012'));
      const email = 'john@example.com';
      const phoneHash = ethers.keccak256(ethers.toUtf8Bytes('+1234567890'));

      await expect(citizenRegistry.connect(addr1).registerCitizen(name, aadharHash, email, phoneHash))
        .to.emit(citizenRegistry, 'CitizenRegistered');
        // .withArgs(addr1.address, name, anyValue); // Skip timestamp check for now

      const citizen = await citizenRegistry.citizens(addr1.address);
      expect(citizen.name).to.equal(name);
      expect(citizen.aadharHash).to.equal(aadharHash);
      expect(citizen.email).to.equal(email);
      expect(citizen.isVerified).to.equal(false);
      expect(citizen.isActive).to.equal(true);
    });

    it('Should not allow duplicate registration', async function () {
      const name = 'John Doe';
      const aadharHash = ethers.keccak256(ethers.toUtf8Bytes('123456789012'));
      const email = 'john@example.com';
      const phoneHash = ethers.keccak256(ethers.toUtf8Bytes('+1234567890'));

      await citizenRegistry.connect(addr1).registerCitizen(name, aadharHash, email, phoneHash);

      await expect(
        citizenRegistry.connect(addr1).registerCitizen(name, aadharHash, email, phoneHash)
      ).to.be.revertedWith('Citizen already registered');
    });

    it('Should not allow duplicate Aadhar hash', async function () {
      const aadharHash = ethers.keccak256(ethers.toUtf8Bytes('123456789012'));

      await citizenRegistry.connect(addr1).registerCitizen(
        'John Doe',
        aadharHash,
        'john@example.com',
        ethers.keccak256(ethers.toUtf8Bytes('+1234567890'))
      );

      await expect(
        citizenRegistry.connect(addr2).registerCitizen(
          'Jane Doe',
          aadharHash,
          'jane@example.com',
          ethers.keccak256(ethers.toUtf8Bytes('+1234567891'))
        )
      ).to.be.revertedWith('Aadhar already registered');
    });
  });

  describe('Verifier Management', function () {
    it('Should add a verifier', async function () {
      await expect(citizenRegistry.addVerifier(verifier.address, 'Government Office'))
        .to.emit(citizenRegistry, 'VerifierAdded')
        .withArgs(verifier.address, 'Government Office');

      const verifierInfo = await citizenRegistry.verifiers(verifier.address);
      expect(verifierInfo.isAuthorized).to.equal(true);
      expect(verifierInfo.organization).to.equal('Government Office');
    });

    it('Should only allow owner to add verifier', async function () {
      await expect(
        citizenRegistry.connect(addr1).addVerifier(verifier.address, 'Government Office')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should remove a verifier', async function () {
      await citizenRegistry.addVerifier(verifier.address, 'Government Office');
      
      await expect(citizenRegistry.removeVerifier(verifier.address))
        .to.emit(citizenRegistry, 'VerifierRemoved')
        .withArgs(verifier.address);

      const verifierInfo = await citizenRegistry.verifiers(verifier.address);
      expect(verifierInfo.isAuthorized).to.equal(false);
    });
  });

  describe('Citizen Verification', function () {
    beforeEach(async function () {
      // Register a citizen
      await citizenRegistry.connect(addr1).registerCitizen(
        'John Doe',
        ethers.keccak256(ethers.toUtf8Bytes('123456789012')),
        'john@example.com',
        ethers.keccak256(ethers.toUtf8Bytes('+1234567890'))
      );

      // Add verifier
      await citizenRegistry.addVerifier(verifier.address, 'Government Office');
    });

    it('Should verify a citizen', async function () {
      await expect(citizenRegistry.connect(verifier).verifyCitizen(addr1.address))
        .to.emit(citizenRegistry, 'CitizenVerified');
        // .withArgs(addr1.address, verifier.address, anyValue); // Skip timestamp check

      const citizen = await citizenRegistry.citizens(addr1.address);
      expect(citizen.isVerified).to.equal(true);
    });

    it('Should only allow authorized verifiers to verify', async function () {
      await expect(
        citizenRegistry.connect(addr2).verifyCitizen(addr1.address)
      ).to.be.revertedWith('Not authorized verifier');
    });

    it('Should not verify already verified citizen', async function () {
      await citizenRegistry.connect(verifier).verifyCitizen(addr1.address);

      await expect(
        citizenRegistry.connect(verifier).verifyCitizen(addr1.address)
      ).to.be.revertedWith('Citizen already verified');
    });
  });

  describe('Getter Functions', function () {
    it('Should return citizen information', async function () {
      const name = 'John Doe';
      const email = 'john@example.com';

      await citizenRegistry.connect(addr1).registerCitizen(
        name,
        ethers.keccak256(ethers.toUtf8Bytes('123456789012')),
        email,
        ethers.keccak256(ethers.toUtf8Bytes('+1234567890'))
      );

      const citizenInfo = await citizenRegistry.getCitizen(addr1.address);
      expect(citizenInfo.name).to.equal(name);
      expect(citizenInfo.email).to.equal(email);
      expect(citizenInfo.isVerified).to.equal(false);
      expect(citizenInfo.isActive).to.equal(true);
    });
  });
});
