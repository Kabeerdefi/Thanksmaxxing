export const runtime = "nodejs";

export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target || !/^https:\/\/pbs\.twimg\.com\/profile_images\//.test(target)) {
    return new Response("Invalid avatar URL", { status: 400 });
  }

  try {
    const upstream = await fetch(target, { redirect: "error", cache: "no-store" });
    const contentType = (upstream.headers.get("content-type") || "").split(";")[0];
    const contentLength = Number(upstream.headers.get("content-length") || 0);
    if (
      !upstream.ok ||
      !/^image\/(jpeg|png|webp)$/.test(contentType) ||
      contentLength > 3_000_000
    ) {
      return new Response("Avatar unavailable", { status: 404 });
    }

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > 3_000_000) {
      return new Response("Avatar too large", { status: 413 });
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Avatar fetch failed", { status: 502 });
  }
}
