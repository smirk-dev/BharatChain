// In-memory data store for development/demo purposes
class InMemoryStore {
  constructor() {
    this.citizens = new Map();
    this.documents = new Map();
    this.grievances = new Map();
  }

  // Citizen operations
  createCitizen(citizenData) {
    const citizen = {
      id: this.generateId(),
      ...citizenData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.citizens.set(citizen.address, citizen);
    return citizen;
  }

  findCitizenByAddress(address) {
    return this.citizens.get(address.toLowerCase());
  }

  updateCitizen(address, updateData) {
    const citizen = this.citizens.get(address.toLowerCase());
    if (!citizen) return null;
    
    Object.assign(citizen, updateData, { updatedAt: new Date() });
    return citizen;
  }

  getAllCitizens() {
    return Array.from(this.citizens.values());
  }

  // Document operations
  createDocument(documentData) {
    const document = {
      id: this.generateId(),
      ...documentData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(document.id, document);
    return document;
  }

  findDocumentById(id) {
    return this.documents.get(id);
  }

  findDocumentsByAddress(address) {
    return Array.from(this.documents.values())
      .filter(doc => doc.citizenAddress === address.toLowerCase());
  }

  updateDocument(id, updateData) {
    const document = this.documents.get(id);
    if (!document) return null;
    
    Object.assign(document, updateData, { updatedAt: new Date() });
    return document;
  }

  // Grievance operations
  createGrievance(grievanceData) {
    const grievance = {
      id: this.generateId(),
      ...grievanceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.grievances.set(grievance.id, grievance);
    return grievance;
  }

  findGrievanceById(id) {
    return this.grievances.get(id);
  }

  findGrievancesByAddress(address) {
    return Array.from(this.grievances.values())
      .filter(grievance => grievance.citizenAddress === address.toLowerCase());
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Statistics
  getStats() {
    return {
      totalCitizens: this.citizens.size,
      verifiedCitizens: Array.from(this.citizens.values()).filter(c => c.isVerified).length,
      totalDocuments: this.documents.size,
      verifiedDocuments: Array.from(this.documents.values()).filter(d => d.status === 'verified').length,
      totalGrievances: this.grievances.size,
    };
  }

  // Seed some demo data
  seedDemoData() {
    // Create demo citizen
    this.createCitizen({
      address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      name: 'Demo Citizen',
      email: 'demo@bharatchain.gov.in',
      phone: '+91-9876543210',
      aadharHash: 'demo_aadhar_hash',
      isVerified: true,
      isActive: true,
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    });

    // Create demo document
    this.createDocument({
      blockchainId: 'demo_doc_1',
      citizenAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      documentType: 'aadhar',
      ipfsHash: 'QmDemoHashAadhar123',
      metadataHash: 'QmDemoMetaHash123',
      status: 'verified',
      metadata: {
        originalName: 'aadhar-card.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
      },
      aiAnalysis: {
        summary: {
          confidence: 0.95,
          is_valid: true,
          document_type: 'aadhar',
          extracted_fields: 4,
        },
      },
    });

    console.log('✅ Demo data seeded successfully');
  }
}

// Create singleton instance
const dataStore = new InMemoryStore();

module.exports = dataStore;
