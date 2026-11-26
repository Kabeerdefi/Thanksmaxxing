import type { Metadata } from "next";
import { RecentCards } from "@/components/RecentCards";

export const metadata: Metadata = {
  title: "The gratitude wall — Thanksmaxxing",
  description: "A wall of little things people are grateful for.",
};

export default function WallPage() {
  return (
    <main className="subpage">
      <div className="subpage-heading">
        <p className="eyebrow">Shared, one line at a time</p>
        <h1>The gratitude<br /><em>wall.</em></h1>
        <p>Every card here is a real NFT, minted by someone who wanted to keep a little thank-you close.</p>
      </div>
      <RecentCards limit={18} />
    </main>
  );
}
