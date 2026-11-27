import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookieOptions, sealCookie, xFlowCookie } from "@/lib/x-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "X OAuth is not configured." }, { status: 503 });

  try {
    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const callback = process.env.X_CALLBACK_URL || new URL("/api/auth/x/callback", request.url).toString();
    const authorize = new URL("https://x.com/i/oauth2/authorize");
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: callback,
      scope: "users.read tweet.read",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    const response = NextResponse.redirect(authorize);
    response.cookies.set(
      xFlowCookie,
      sealCookie({ state, verifier, callback, exp: Math.floor(Date.now() / 1000) + 600 }),
      cookieOptions(600),
    );
    return response;
  } catch {
    return NextResponse.json({ error: "X sign-in is not configured correctly." }, { status: 503 });
  }
}
