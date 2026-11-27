import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      next: { revalidate: 60 },
    });
    if (!response.ok) return NextResponse.json({ usd: null }, { status: 502 });
    const payload = (await response.json()) as { data?: { amount?: string } };
    const usd = Number(payload.data?.amount);
    if (!Number.isFinite(usd) || usd <= 0) {
      return NextResponse.json({ usd: null }, { status: 502 });
    }
    return NextResponse.json(
      { usd },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ usd: null }, { status: 502 });
  }
}
