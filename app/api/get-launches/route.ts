import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Fetch recent launches, ordered by timestamp descending
    const snapshot = await db
      .ref("launches")
      .orderByChild("timestamp")
      .limitToLast(limit)
      .once("value");

    const launches: any[] = [];
    snapshot.forEach((child) => {
      launches.push({
        id: child.key,
        ...child.val(),
      });
    });

    // Reverse to show newest first
    launches.reverse();

    return NextResponse.json({
      launches,
    });
  } catch (error: any) {
    console.error("Get launches error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get launches" },
      { status: 500 }
    );
  }
}
