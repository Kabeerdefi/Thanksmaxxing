import Image from "next/image";

type CardArtProps = {
  text: string;
  tokenId?: string;
  owner?: string;
  xUsername?: string;
  avatarUrl?: string;
  preview?: boolean;
};

function shortAddress(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

export function CardArt({
  text,
  tokenId,
  owner,
  xUsername,
  avatarUrl,
  preview = false,
}: CardArtProps) {
  const message = text.trim() || "Your gratitude goes here…";
  const messageBytes = new TextEncoder().encode(message).length;
  const displayOwner = owner ? shortAddress(owner) : "0x0000…0000";
  const displayId = tokenId ? "#" + tokenId.padStart(4, "0") : "#0000";
  const handle = xUsername ? "@" + xUsername : preview ? "@yourname" : "@collector";

  return (
    <article
      className="card-art"
      aria-label={"Thanksmaxxing gratitude card: " + (text.trim() || "preview")}
    >
      <Image
        className="card-template-image"
        src="/thanksmaxxing-card-template.webp"
        width={960}
        height={1280}
        sizes="(max-width: 650px) 100vw, 50vw"
        alt=""
        aria-hidden="true"
      />
      <div className="card-message-mask">
        <p className={text.trim() ? "card-message" : "card-message card-message-placeholder"}>
          <span className={messageBytes > 260 ? "card-message-tiny" : messageBytes > 82 ? "card-message-small" : messageBytes > 58 ? "card-message-medium" : messageBytes > 36 ? "card-message-compact" : ""}>
            {message}
          </span>
        </p>
      </div>
      <div className="card-id-mask">{displayId}</div>
      {avatarUrl ? (
        <span className="card-avatar-mask">
          <span className="card-avatar-slot">
            <Image
              src={avatarUrl}
              alt={xUsername ? "X profile photo for @" + xUsername : "X profile photo"}
              fill
              sizes="84px"
              unoptimized
            />
          </span>
        </span>
      ) : null}
      <div className="card-owner-mask">
        <span className="card-owner-handle">{handle}</span>
        <span className="card-owner-address">{displayOwner}</span>
      </div>
    </article>
  );
}
