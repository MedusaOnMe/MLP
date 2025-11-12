import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mint, name, symbol, imageUrl, creator, signature, timestamp } = body;

    if (!mint || !name || !symbol) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to Firebase Realtime Database
    const launchRef = db.ref("launches").push();
    await launchRef.set({
      mint,
      name,
      symbol,
      imageUrl: imageUrl || "",
      creator: creator || "",
      signature: signature || "",
      timestamp: timestamp || Date.now(),
      pumpfunUrl: `https://pump.fun/coin/${mint}`,
    });

    return NextResponse.json({
      success: true,
      launchId: launchRef.key,
    });
  } catch (error: any) {
    console.error("Save launch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save launch" },
      { status: 500 }
    );
  }
}
