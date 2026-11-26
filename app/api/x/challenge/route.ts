import { randomBytes } from "node:crypto";
import { isAddress } from "viem";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  cookieOptions,
  getXIdentity,
  sealCookie,
  walletChallengeCookie,
} from "@/lib/x-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const identity = await getXIdentity();
  if (!identity) return NextResponse.json({ error: "Connect your X account first." }, { status: 401 });
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const wallet = new URL(request.url).searchParams.get("wallet");
  if (!wallet || !isAddress(wallet)) return NextResponse.json({ error: "Connect a valid wallet." }, { status: 400 });

  try {
    const nonce = randomBytes(32).toString("base64url");
    const issuedAt = Math.floor(Date.now() / 1000);
    const exp = issuedAt + 300;
    const message = [
      "Thanksmaxxing X account mint authorization",
      "Wallet: " + wallet.toLowerCase(),
      "X account ID: " + identity.id,
      "Nonce: " + nonce,
      "Issued at: " + issuedAt,
      "Expires at: " + exp,
    ].join("\n");
    const response = NextResponse.json({ message });
    response.cookies.set(
      walletChallengeCookie,
      sealCookie({ wallet: wallet.toLowerCase(), xUserId: identity.id, nonce, issuedAt, exp }),
      cookieOptions(300),
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Wallet authorization is not configured." }, { status: 503 });
  }
}
