import { NextResponse } from "next/server";
import { getXIdentity } from "@/lib/x-auth";

export const runtime = "nodejs";

export async function GET() {
  const identity = await getXIdentity();
  if (!identity) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: true,
    profile: { id: identity.id, username: identity.username, profileImageUrl: identity.profileImageUrl },
  });
}
