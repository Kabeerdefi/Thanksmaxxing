import { createElement } from "react";
import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { contractAddress, thanksmaxxingAbi } from "@/config/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shortAddress(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[1-9][0-9]*$/.test(id) || !contractAddress) {
    return new Response("Card not found", { status: contractAddress ? 404 : 503 });
  }

  try {
    const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? base : baseSepolia;
    const rpc =
      process.env.NEXT_PUBLIC_BASE_RPC_URL ||
      (chain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org");
    const client = createPublicClient({ chain, transport: http(rpc) });
    const tokenId = BigInt(id);
    const [text, owner, xUsername, avatarUrl] = await Promise.all([
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "gratitude",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "xUsername",
        args: [tokenId],
      }),
      client.readContract({
        address: contractAddress,
        abi: thanksmaxxingAbi,
        functionName: "xProfileImageUrl",
        args: [tokenId],
      }),
    ]);
    let avatarSrc: string | undefined;
    if (/^https:\/\/pbs\.twimg\.com\/profile_images\//.test(avatarUrl)) {
      try {
        const avatarResponse = await fetch(avatarUrl, {
          redirect: "error",
          cache: "no-store",
        });
        const contentType = avatarResponse.headers.get("content-type") || "";
        const imageType = contentType.split(";")[0];
        const contentLength = Number(avatarResponse.headers.get("content-length") || 0);
        if (
          avatarResponse.ok &&
          /^image\/(jpeg|png|webp)$/.test(imageType) &&
          (!contentLength || contentLength <= 3_000_000)
        ) {
          const avatarBytes = Buffer.from(await avatarResponse.arrayBuffer());
          if (avatarBytes.length <= 3_000_000) {
            avatarSrc = "data:" + imageType + ";base64," + avatarBytes.toString("base64");
          }
        }
      } catch {
        avatarSrc = undefined;
      }
    }
    const requestOrigin = new URL(request.url).origin;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
    const templateResponse = await fetch(new URL("/thanksmaxxing-card-template.webp", requestOrigin), {
      cache: "no-store",
    }).catch(() => fetch(new URL("/thanksmaxxing-card-template.webp", siteUrl), { cache: "no-store" }));
    if (!templateResponse.ok) throw new Error("Card template not found.");
    const imageData = Buffer.from(await templateResponse.arrayBuffer()).toString("base64");
    const imageSrc = "data:image/webp;base64," + imageData;
    const textBytes = new TextEncoder().encode(text).length;
    const messageFontSize = textBytes > 82 ? 27 : textBytes > 58 ? 32 : textBytes > 36 ? 36 : 49;
    const element = createElement(
      "div",
      {
        style: {
          display: "flex",
          position: "relative",
          width: "960px",
          height: "1280px",
          overflow: "hidden",
        },
      },
      createElement("img", {
        src: imageSrc,
        width: "960",
        height: "1280",
        style: { position: "absolute", left: "0", top: "0", width: "960px", height: "1280px" },
      }),
      avatarSrc
        ? createElement(
            "div",
            {
              style: {
                position: "absolute",
                left: "86px",
                top: "1133px",
                width: "81px",
                height: "83px",
                borderRadius: "16px",
                backgroundColor: "#f8f1ef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            createElement("img", {
              src: avatarSrc,
              width: "78",
              height: "78",
              style: {
                width: "78px",
                height: "78px",
                borderRadius: "50%",
                border: "3px solid #142dce",
                objectFit: "cover",
              },
            }),
          )
        : null,
      createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: "90px",
            top: "365px",
            width: "686px",
            height: "250px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "flex-start",
            overflow: "hidden",
          },
        },
        createElement(
          "div",
          {
            style: {
              color: "#0923ad",
              fontFamily: "Georgia, Times New Roman, serif",
              fontSize: messageFontSize,
              fontWeight: 700,
              fontStyle: "italic",
              lineHeight: 1.06,
              letterSpacing: "-1.3px",
              wordBreak: "break-word",
            },
          },
          text,
        ),
      ),
      createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: "106px",
            top: "1006px",
            width: "242px",
            height: "58px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            paddingLeft: "10px",
            borderRadius: "4px",
            transform: "rotate(-5.2deg)",
            backgroundColor: "#f7f4ef",
            color: "#0923ad",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "49px",
            fontWeight: 900,
            letterSpacing: "-2px",
          },
        },
        "#" + id.padStart(4, "0"),
      ),
      createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: "184px",
            top: "1140px",
            width: "216px",
            height: "69px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "4px",
            paddingLeft: "6px",
            overflow: "hidden",
            backgroundColor: "#f8f1ef",
            color: "#0923ad",
            fontFamily: "Arial, Helvetica, sans-serif",
          },
        },
        createElement("div", { style: { fontSize: "20px", fontWeight: 800, lineHeight: 1 } }, "@" + xUsername),
        createElement(
          "div",
          {
            style: {
              fontFamily: "Courier New, monospace",
              fontSize: "17px",
              lineHeight: 1.1,
            },
          },
          shortAddress(owner),
        ),
      ),
    );

    const download = new URL(request.url).searchParams.get("download") === "1";
    return new ImageResponse(element, {
      width: 960,
      height: 1280,
      headers: download
        ? { "Content-Disposition": `attachment; filename="thanksmaxxing-${id}.png"` }
        : undefined,
    });
  } catch {
    return new Response("Card not found", { status: 404 });
  }
}
