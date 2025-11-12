import { PublicKey } from "@solana/web3.js";

export const PUMP_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);

export const MAYHEM_PROGRAM_ID = new PublicKey(
  "MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e"
);

// Derived from seed "global" on pump program
const [GLOBAL_ACCOUNT_DERIVED] = PublicKey.findProgramAddressSync(
  [Buffer.from("global")],
  new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
);

export const GLOBAL_ACCOUNT = GLOBAL_ACCOUNT_DERIVED;

export const FEE_RECIPIENT = new PublicKey(
  "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"
);

export const MAYHEM_FEE_RECIPIENT = new PublicKey(
  "GesfTA3X2arioaHp8bbKdjG9vJtskViWACZoYvxp4twS"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const SYSTEM_PROGRAM_ID = new PublicKey(
  "11111111111111111111111111111111"
);

export const RENT_PROGRAM_ID = new PublicKey(
  "SysvarRent111111111111111111111111111111111"
);

// Derived from seed "__event_authority" on pump program
const [EVENT_AUTHORITY_DERIVED] = PublicKey.findProgramAddressSync(
  [Buffer.from("__event_authority")],
  new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
);

export const EVENT_AUTHORITY = EVENT_AUTHORITY_DERIVED;

export const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
