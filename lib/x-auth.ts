import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const xSessionCookie = "thanksmaxxing_x_session";
export const xFlowCookie = "thanksmaxxing_x_flow";
export const walletChallengeCookie = "thanksmaxxing_wallet_challenge";

export type XIdentity = {
  id: string;
  username: string;
  profileImageUrl: string;
  exp: number;
};

function cookieSecret() {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_COOKIE_SECRET must be at least 32 bytes.");
  }
  return secret;
}

export function sealCookie(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", cookieSecret()).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function openCookie<T>(value: string | undefined): T | null {
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", cookieSecret()).update(payload).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getXIdentity(): Promise<XIdentity | null> {
  try {
    const jar = await cookies();
    const session = openCookie<XIdentity>(jar.get(xSessionCookie)?.value);
    if (
      !session ||
      session.exp <= Math.floor(Date.now() / 1000) ||
      !/^\d{1,30}$/.test(session.id) ||
      !/^[A-Za-z0-9_]{1,15}$/.test(session.username) ||
      !/^https:\/\/pbs\.twimg\.com\/profile_images\//.test(session.profileImageUrl)
    ) return null;
    return session;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.X_CALLBACK_URL;
  if (!configured) return false;
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}
