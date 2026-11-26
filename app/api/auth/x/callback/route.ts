import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  cookieOptions,
  openCookie,
  sealCookie,
  xFlowCookie,
  xSessionCookie,
} from "@/lib/x-auth";

export const runtime = "nodejs";

type OAuthFlow = { state: string; verifier: string; callback: string; exp: number };
type XUserResponse = {
  data?: { id?: string; username?: string; profile_image_url?: string };
};

function returnToSite(request: Request, status: "connected" | "error") {
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const url = new URL("/", site);
  url.hash = "mint";
  url.searchParams.set("x", status);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const jar = await cookies();
  const flow = openCookie<OAuthFlow>(jar.get(xFlowCookie)?.value);
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const response = returnToSite(request, "error");
  response.cookies.set(xFlowCookie, "", cookieOptions(0));

  if (
    !code ||
    !returnedState ||
    !flow ||
    flow.exp <= Math.floor(Date.now() / 1000) ||
    returnedState !== flow.state ||
    !clientId ||
    !clientSecret
  ) return response;

  try {
    const body = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: flow.callback,
      code_verifier: flow.verifier,
    });
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });
    if (!tokenResponse.ok) return response;
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return response;

    const userResponse = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url", {
      headers: { Authorization: "Bearer " + token.access_token },
      cache: "no-store",
    });
    if (!userResponse.ok) return response;
    const payload = (await userResponse.json()) as XUserResponse;
    const user = payload.data;
    if (
      !user?.id ||
      !/^\d{1,30}$/.test(user.id) ||
      !user.username ||
      !/^[A-Za-z0-9_]{1,15}$/.test(user.username) ||
      !user.profile_image_url ||
      !/^https:\/\/pbs\.twimg\.com\/profile_images\//.test(user.profile_image_url)
    ) return response;

    response.cookies.set(
      xSessionCookie,
      sealCookie({
        id: user.id,
        username: user.username,
        profileImageUrl: user.profile_image_url,
        exp: Math.floor(Date.now() / 1000) + 86400,
      }),
      cookieOptions(86400),
    );
    const destination = returnToSite(request, "connected");
    destination.cookies.set(xFlowCookie, "", cookieOptions(0));
    destination.cookies.set(xSessionCookie, response.cookies.get(xSessionCookie)!.value, cookieOptions(86400));
    return destination;
  } catch {
    return response;
  }
}
