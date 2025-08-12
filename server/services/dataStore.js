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

    // Create demo grievance
    this.createGrievance({
      blockchainId: 'demo_grv_1',
      citizenAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      title: 'Street Light Not Working',
      description: 'The street light on Main Road near City Mall has been non-functional for the past 2 weeks. This is causing safety issues for pedestrians and vehicles during night time.',
      category: 'infrastructure',
      priority: 'medium',
      location: 'Main Road, near City Mall, New Delhi',
      status: 'under_review',
      handledBy: '0x742d35cc6527c6c7e3f24b8e92ff8a2c7f4b1234',
      response: 'We have received your complaint and our technical team will inspect the area within 2 working days.',
    });

    console.log('✅ Demo data seeded successfully');
  }

  // Additional grievance helper methods
  getGrievancesByCitizen(citizenAddress, filters = {}) {
    const grievances = Array.from(this.data.grievances.values())
      .filter(grievance => grievance.citizenAddress === citizenAddress);
    
    let filtered = grievances;
    
    if (filters.status) {
      filtered = filtered.filter(g => g.status === filters.status);
    }
    
    if (filters.category) {
      filtered = filtered.filter(g => g.category === filters.category);
    }
    
    // Simple pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return filtered
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(startIndex, endIndex);
  }

  getAllGrievances(filters = {}) {
    let grievances = Array.from(this.data.grievances.values());
    
    if (filters.status) {
      grievances = grievances.filter(g => g.status === filters.status);
    }
    
    if (filters.category) {
      grievances = grievances.filter(g => g.category === filters.category);
    }
    
    return grievances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addGrievanceComment(grievanceId, commentData) {
    const grievance = this.data.grievances.get(grievanceId);
    if (!grievance) return null;
    
    if (!grievance.comments) {
      grievance.comments = [];
    }
    
    grievance.comments.push(commentData);
    grievance.updatedAt = new Date();
    
    this.data.grievances.set(grievanceId, grievance);
    return grievance;
  }

  getGrievanceStats() {
    const grievances = Array.from(this.data.grievances.values());
    
    const stats = {
      total: grievances.length,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      recent: grievances
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(g => ({
          id: g.id,
          title: g.title,
          status: g.status,
          category: g.category,
          createdAt: g.createdAt,
        })),
    };
    
    // Count by status
    grievances.forEach(g => {
      stats.byStatus[g.status] = (stats.byStatus[g.status] || 0) + 1;
    });
    
    // Count by category
    grievances.forEach(g => {
      stats.byCategory[g.category] = (stats.byCategory[g.category] || 0) + 1;
    });
    
    // Count by priority
    grievances.forEach(g => {
      if (g.priority) {
        stats.byPriority[g.priority] = (stats.byPriority[g.priority] || 0) + 1;
      }
    });
    
    return stats;
  }
}

// Create singleton instance
const dataStore = new InMemoryStore();

module.exports = dataStore;
