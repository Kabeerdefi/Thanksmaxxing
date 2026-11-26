import { NextResponse } from "next/server";
import { cookieOptions, xSessionCookie } from "@/lib/x-auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/#mint", request.url));
  response.cookies.set(xSessionCookie, "", cookieOptions(0));
  return response;
}
