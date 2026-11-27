import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { MusicToggle } from "@/components/MusicToggle";

export const metadata: Metadata = {
  title: "Thanksmaxxing — a little gratitude, kept forever",
  description:
    "Turn one thing you're grateful for into a numbered keepsake on Base.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Thanksmaxxing",
    description: "One line of gratitude. A keepsake on Base.",
    siteName: "Thanksmaxxing",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="site-shell">
            <header className="topbar">
              <Link className="wordmark" href="/" aria-label="Thanksmaxxing home">
                <span>thanksmaxxing</span>
              </Link>
              <nav className="nav-links" aria-label="Main navigation">
                <Link href="/wall">The wall</Link>
                <a href="#how-it-works">How it works</a>
              </nav>
              <div className="nav-actions">
                <a className="nav-cta" href="#mint">Make a card <span aria-hidden="true">↗</span></a>
              </div>
            </header>
            {children}
            <MusicToggle />
            <footer className="footer">
              <Link className="wordmark footer-wordmark" href="/">
                <span>thanksmaxxing</span>
              </Link>
              <span>One small thank-you, kept forever.</span>
              <a href="https://base.org" target="_blank" rel="noreferrer">Built on Base ↗</a>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
