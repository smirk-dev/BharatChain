// DID utilities (ETHR-based identifiers)

export const createDID = (walletAddress) => {
  if (!walletAddress) throw new Error("Wallet address is required");
  return `did:ethr:${walletAddress.toLowerCase()}`;
};

export const verifyDID = (did) => {
  return typeof did === "string" && /^did:ethr:0x[a-fA-F0-9]{40}$/.test(did);
};

export const parseDID = (did) => {
  if (!verifyDID(did)) throw new Error("Invalid DID format");
  return {
    method: "ethr",
    address: did.split(":")[2],
  };
};
