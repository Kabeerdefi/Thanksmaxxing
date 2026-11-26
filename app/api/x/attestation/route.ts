import { privateKeyToAccount } from "viem/accounts";
import { isAddress, verifyMessage, type Address, type Hex } from "viem";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  getXIdentity,
  openCookie,
  walletChallengeCookie,
} from "@/lib/x-auth";

export const runtime = "nodejs";

type WalletChallenge = {
  wallet: string;
  xUserId: string;
  nonce: string;
  issuedAt: number;
  exp: number;
};

const types = {
  MintAuthorization: [
    { name: "wallet", type: "address" },
    { name: "xUserId", type: "uint256" },
    { name: "username", type: "string" },
    { name: "profileImageUrl", type: "string" },
    { name: "nonce", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const identity = await getXIdentity();
  if (!identity) return NextResponse.json({ error: "Connect your X account first." }, { status: 401 });

  let body: { wallet?: string; message?: string; signature?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid wallet authorization." }, { status: 400 });
  }
  if (!body.wallet || !isAddress(body.wallet) || !body.message || !body.signature || !/^0x[0-9a-fA-F]{130}$/.test(body.signature)) {
    return NextResponse.json({ error: "Invalid wallet authorization." }, { status: 400 });
  }

  try {
    const jar = await cookies();
    const challenge = openCookie<WalletChallenge>(jar.get(walletChallengeCookie)?.value);
    if (
      !challenge ||
      challenge.exp <= Math.floor(Date.now() / 1000) ||
      challenge.wallet !== body.wallet.toLowerCase() ||
      challenge.xUserId !== identity.id
    ) return NextResponse.json({ error: "Wallet authorization expired. Try again." }, { status: 401 });

    const expectedMessage = [
      "Thanksmaxxing X account mint authorization",
      "Wallet: " + challenge.wallet,
      "X account ID: " + challenge.xUserId,
      "Nonce: " + challenge.nonce,
      "Issued at: " + challenge.issuedAt,
      "Expires at: " + challenge.exp,
    ].join("\n");
    if (body.message !== expectedMessage) {
      return NextResponse.json({ error: "Wallet authorization does not match." }, { status: 401 });
    }
    const walletVerified = await verifyMessage({
      address: body.wallet as Address,
      message: expectedMessage,
      signature: body.signature as Hex,
    });
    if (!walletVerified) return NextResponse.json({ error: "Wallet signature could not be verified." }, { status: 401 });

    const privateKey = process.env.X_ATTESTOR_PRIVATE_KEY as Hex | undefined;
    const expectedAttestor = process.env.X_ATTESTOR_ADDRESS;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address | undefined;
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "84532");
    if (!privateKey || !expectedAttestor || !contractAddress || !isAddress(expectedAttestor) || !isAddress(contractAddress)) {
      return NextResponse.json({ error: "X mint attestation is not configured yet." }, { status: 503 });
    }
    if (chainId !== 84532 && chainId !== 8453) {
      return NextResponse.json({ error: "Unsupported mint network." }, { status: 503 });
    }

    const account = privateKeyToAccount(privateKey);
    if (account.address.toLowerCase() !== expectedAttestor.toLowerCase()) {
      return NextResponse.json({ error: "X mint attestor configuration does not match." }, { status: 503 });
    }
    const nonce = ("0x" + Buffer.from(challenge.nonce, "base64url").toString("hex")) as Hex;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
    const message = {
      wallet: body.wallet as Address,
      xUserId: BigInt(identity.id),
      username: identity.username,
      profileImageUrl: identity.profileImageUrl,
      nonce,
      deadline,
    };
    const signature = await account.signTypedData({
      domain: { name: "Thanksmaxxing", version: "1", chainId, verifyingContract: contractAddress },
      types,
      primaryType: "MintAuthorization",
      message,
    });

    const response = NextResponse.json({
      xUserId: identity.id,
      username: identity.username,
      profileImageUrl: identity.profileImageUrl,
      nonce,
      deadline: deadline.toString(),
      signature,
    });
    response.cookies.set(walletChallengeCookie, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not verify the X and wallet connection." }, { status: 503 });
  }
}
