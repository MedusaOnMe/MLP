import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, symbol, description, imageUrl, website, twitter, telegram } = body;

    if (!name || !symbol || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const metadata: any = {
      name,
      symbol,
      description,
      image: imageUrl,
    };

    // Add optional social links if provided
    if (website) metadata.external_url = website;
    if (twitter || telegram) {
      metadata.extensions = {};
      if (twitter) metadata.extensions.twitter = twitter;
      if (telegram) metadata.extensions.telegram = telegram;
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || "Failed to upload metadata" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      hash: data.IpfsHash,
    });
  } catch (error: any) {
    console.error("Upload metadata error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload metadata" },
      { status: 500 }
    );
  }
}
