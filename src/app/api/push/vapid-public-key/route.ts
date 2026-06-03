import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/features/push/service";

export const dynamic = "force-dynamic";

export function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 },
    );
  }
  return NextResponse.json({ publicKey: key });
}
