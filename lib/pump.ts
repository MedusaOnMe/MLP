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

export async function createToken(
  connection: Connection,
  wallet: any,
  params: CreateTokenParams
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

    return signature;
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

// Upload metadata JSON to IPFS via server-side API
export async function uploadMetadataToPinata(
  name: string,
  symbol: string,
  description: string,
  imageUrl: string
): Promise<string> {
  try {
    const response = await fetch("/api/upload-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        symbol,
        description,
        imageUrl,
      }),
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
