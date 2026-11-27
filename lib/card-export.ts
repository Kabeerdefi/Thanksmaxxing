type CardExportParams = {
  text: string;
  tokenId: string;
  owner: string;
  xUsername?: string;
  avatarUrl?: string;
};

function shortAddress(address: string) {
  return address.slice(0, 6) + "…" + address.slice(-4);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image: " + src));
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? current + " " + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);

      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function renderCardBlob({
  text,
  tokenId,
  owner,
  xUsername,
  avatarUrl,
}: CardExportParams): Promise<Blob> {
  const width = 960;
  const height = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const template = await loadImage("/thanksmaxxing-card-template.webp");
  ctx.drawImage(template, 0, 0, width, height);

  // Gratitude message (9.4%, 28.5%, 71.5%, 19.5%)
  const message = text.trim() || "Your gratitude goes here…";
  const bytes = new TextEncoder().encode(message).length;
  const fontSize = bytes > 260 ? 19.68 : bytes > 82 ? 27.36 : bytes > 58 ? 31.68 : bytes > 36 ? 36 : 49.44;
  const lineHeight = fontSize * (bytes > 82 ? 1.08 : 1.06);
  ctx.save();
  ctx.fillStyle = "#0923ad";
  ctx.font = `italic 700 ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.textBaseline = "top";
  const boxX = width * 0.094;
  const boxY = height * 0.285;
  const boxW = width * 0.715;
  const boxH = height * 0.195;
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxW, boxH);
  ctx.clip();
  const lines = wrapLines(ctx, message, boxW);
  lines.forEach((line, index) => {
    const y = boxY + index * lineHeight;
    if (y + fontSize <= boxY + boxH + 4) {
      ctx.fillText(line, boxX, y);
    }
  });
  ctx.restore();

  // Tilted ticket ID (#0000) centered around (25.2%, 80.45%) rotated -5.2deg
  ctx.save();
  const idCenterX = width * 0.252;
  const idCenterY = height * 0.8045;
  const idW = width * 0.28;
  const idH = height * 0.061;
  ctx.translate(idCenterX, idCenterY);
  ctx.rotate((-5.2 * Math.PI) / 180);
  ctx.fillStyle = "#f7f4ef";
  ctx.beginPath();
  ctx.roundRect(-idW / 2, -idH / 2, idW, idH, 4);
  ctx.fill();
  ctx.fillStyle = "#0923ad";
  ctx.font = `900 ${width * 0.051}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("#" + tokenId.padStart(4, "0"), -idW / 2 + width * 0.01, 1);
  ctx.restore();

  // Avatar (left: 8.95%, top: 88.55%, width: 8.4%, height: 6.45%)
  if (avatarUrl) {
    try {
      const proxiedUrl = "/api/avatar?url=" + encodeURIComponent(avatarUrl);
      const avatar = await loadImage(proxiedUrl);
      const ax = width * 0.0895;
      const ay = height * 0.8855;
      const aw = width * 0.084;
      const ah = height * 0.0645;
      const r = Math.min(aw, ah) / 2;
      const cx = ax + aw / 2;
      const cy = ay + ah / 2;

      ctx.save();
      ctx.fillStyle = "#f8f1ef";
      ctx.beginPath();
      ctx.roundRect(ax - 2, ay - 2, aw + 4, ah + 4, 14);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();

      ctx.strokeStyle = "#142dce";
      ctx.lineWidth = width * 0.0038;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } catch {
      // Keep template placeholder avatar if image fails to load.
    }
  }

  // Owner handle & short address (left: 19.2%, top: 89.1%, width: 22.5%, height: 5.4%)
  ctx.save();
  const ox = width * 0.192;
  const oy = height * 0.891;
  const ow = width * 0.225;
  const oh = height * 0.054;
  ctx.fillStyle = "#f8f1ef";
  ctx.fillRect(ox, oy, ow, oh);
  ctx.fillStyle = "#0923ad";
  ctx.font = `800 ${width * 0.021}px Arial, Helvetica, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(xUsername ? "@" + xUsername : "@collector", ox + width * 0.006, oy + oh * 0.16);
  ctx.font = `600 ${width * 0.0175}px "Courier New", monospace`;
  ctx.fillText(shortAddress(owner), ox + width * 0.006, oy + oh * 0.56);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Could not export PNG."));
      else resolve(blob);
    }, "image/png");
  });
}

export async function downloadCardPng(params: CardExportParams) {
  const blob = await renderCardBlob(params);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `thanksmaxxing-${params.tokenId}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
