import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  PUMP_PROGRAM_ID,
  MAYHEM_PROGRAM_ID,
  GLOBAL_ACCOUNT,
  FEE_RECIPIENT,
  MAYHEM_FEE_RECIPIENT,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  RENT_PROGRAM_ID,
  EVENT_AUTHORITY,
  METADATA_PROGRAM_ID,
} from "./constants";
import pumpIdl from "./pump_idl.json";

export interface CreateTokenParams {
  name: string;
  symbol: string;
  uri: string;
  creator: PublicKey;
  isMayhemMode: boolean;
}

export interface CreateTokenResult {
  signature: string;
  mint: string;
}

export async function createToken(
  connection: Connection,
  wallet: any,
  params: CreateTokenParams
): Promise<CreateTokenResult> {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    const program = new anchor.Program(
      pumpIdl as anchor.Idl,
      provider
    );

    // Generate new mint keypair
    const mint = Keypair.generate();

    // Derive mint authority PDA
    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      PUMP_PROGRAM_ID
    );

    // Derive bonding curve PDA
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mint.publicKey.toBuffer()],
      PUMP_PROGRAM_ID
    );

    // Derive mayhem protocol PDAs
    const [globalParams] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-params")],
      MAYHEM_PROGRAM_ID
    );

    const [solVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol-vault")],
      MAYHEM_PROGRAM_ID
    );

    const [mayhemState] = PublicKey.findProgramAddressSync(
      [Buffer.from("mayhem-state"), mint.publicKey.toBuffer()],
      MAYHEM_PROGRAM_ID
    );

    // Get associated token account for bonding curve (Token-2022)
    const [bondingCurveAta] = PublicKey.findProgramAddressSync(
      [
        bondingCurve.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Mayhem token vault is an ATA for sol_vault
    const [mayhemTokenVault] = PublicKey.findProgramAddressSync(
      [
        solVault.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Send transaction using Anchor
    const signature = await program.methods
      .createV2(params.name, params.symbol, params.uri, params.creator, params.isMayhemMode)
      .accounts({
        mint: mint.publicKey,
        mintAuthority: mintAuthority,
        bondingCurve: bondingCurve,
        associatedBondingCurve: bondingCurveAta,
        global: GLOBAL_ACCOUNT,
        user: wallet.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        mayhemProgramId: MAYHEM_PROGRAM_ID,
        globalParams: globalParams,
        solVault: solVault,
        mayhemState: mayhemState,
        mayhemTokenVault: mayhemTokenVault,
        eventAuthority: EVENT_AUTHORITY,
        program: PUMP_PROGRAM_ID,
      })
      .signers([mint])
      .rpc();

    return {
      signature,
      mint: mint.publicKey.toString(),
    };
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

// Upload image to IPFS via server-side API
export async function uploadImageToPinata(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image to IPFS");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

// Upload metadata JSON to IPFS via server-side API
export async function uploadMetadataToPinata(
  metadata: TokenMetadata
): Promise<string> {
  try {
    const response = await fetch("/api/upload-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload metadata to IPFS");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw error;
  }
}

export interface BuyTokenParams {
  mint: PublicKey;
  solAmount: number; // SOL amount to spend
  minTokensOut: number; // Minimum tokens expected (slippage protection)
}

// Buy tokens from bonding curve (dev buy)
export async function buyTokens(
  connection: Connection,
  wallet: any,
  params: BuyTokenParams
): Promise<string> {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );

    const program = new anchor.Program(
      pumpIdl as anchor.Idl,
      provider
    );

    // Derive bonding curve PDA
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), params.mint.toBuffer()],
      PUMP_PROGRAM_ID
    );

    // Get associated token account for bonding curve
    const [bondingCurveAta] = PublicKey.findProgramAddressSync(
      [
        bondingCurve.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        params.mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get user's token account
    const [userAta] = PublicKey.findProgramAddressSync(
      [
        wallet.publicKey.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        params.mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Convert SOL to lamports
    const solInLamports = Math.floor(params.solAmount * 1e9);
    const minTokensOutAmount = Math.floor(params.minTokensOut * 1e6); // Assuming 6 decimals

    // Derive global volume accumulator
    const [globalVolumeAccumulator] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-volume-accumulator")],
      PUMP_PROGRAM_ID
    );

    // Derive user volume accumulator
    const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(
      [Buffer.from("user-volume-accumulator"), wallet.publicKey.toBuffer()],
      PUMP_PROGRAM_ID
    );

    // Derive fee config
    const FEE_PROGRAM_ID = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");
    const [feeConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee-config"),
        Buffer.from([
          1, 86, 224, 246, 147, 102, 90, 207, 68, 219, 21, 104, 191, 23, 91, 170,
          81, 137, 203, 151, 245, 210, 255, 59, 101, 93, 43, 182, 253, 109, 24, 176
        ])
      ],
      FEE_PROGRAM_ID
    );

    // Call buy_exact_sol_in instruction
    const signature = await program.methods
      .buyExactSolIn(
        new anchor.BN(solInLamports),
        new anchor.BN(minTokensOutAmount),
        { some: true } // track_volume = Some(true)
      )
      .accounts({
        global: GLOBAL_ACCOUNT,
        feeRecipient: FEE_RECIPIENT,
        mint: params.mint,
        bondingCurve: bondingCurve,
        associatedBondingCurve: bondingCurveAta,
        associatedUser: userAta,
        user: wallet.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        creatorVault: wallet.publicKey, // Will be derived by program
        eventAuthority: EVENT_AUTHORITY,
        program: PUMP_PROGRAM_ID,
        globalVolumeAccumulator: globalVolumeAccumulator,
        userVolumeAccumulator: userVolumeAccumulator,
        feeConfig: feeConfig,
        feeProgram: FEE_PROGRAM_ID,
      })
      .rpc();

    return signature;
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw error;
  }
}
