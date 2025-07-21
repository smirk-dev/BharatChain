// Placeholder for Decentralized Identity (DID) support

export const createDID = (walletAddress) => {
  return `did:ethr:${walletAddress}`;
};

export const verifyDID = (did) => {
  return did.startsWith("did:ethr:");
};
