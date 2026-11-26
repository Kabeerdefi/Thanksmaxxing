import { MintForm } from "@/components/MintForm";
import { RecentCards } from "@/components/RecentCards";
import { CardArt } from "@/components/CardArt";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-note"><span className="status-dot" /> THANKSGIVING 2026 · ON BASE</div>
          <h1>A little<br /><em>gratitude.</em><br />Kept forever.</h1>
          <p>Turn one thing you’re grateful for into a numbered keepsake on Base. Yours to hold, share, and come back to.</p>
          <a className="button button-primary hero-cta" href="#mint">Make your card <span aria-hidden="true">↓</span></a>
          <div className="hero-proof"><span>01</span><span>One honest line</span><i>·</i><span>One lasting keepsake</span></div>
        </div>
        <div className="hero-visual" aria-label="Example gratitude card">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="hero-template-card">
            <CardArt text="the people who make this feel like home" tokenId="0000" preview />
          </div>
          <div className="hero-sticker">made of<br /><strong>thanks</strong><span>✳</span></div>
          <div className="hero-caption">A small note to your future self.</div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>ONE LINE. ONE KEEPSAKE.</span><b>✳</b><span>THANKSGIVING 2026</span><b>✳</b><span>MADE TO BE SHARED</span><b>✳</b>
          <span>ONE LINE. ONE KEEPSAKE.</span><b>✳</b><span>THANKSGIVING 2026</span><b>✳</b><span>MADE TO BE SHARED</span><b>✳</b>
        </div>
      </div>

      <MintForm />

      <section className="wall-section" id="wall">
        <div className="section-heading">
          <div><p className="eyebrow">A growing collection</p><h2>The gratitude wall</h2></div>
          <a className="text-link" href="/wall">See every card <span aria-hidden="true">↗</span></a>
        </div>
        <RecentCards />
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-heading">
          <p className="eyebrow">A keepsake in three small steps</p>
          <h2>Say thanks.<br /><em>Make it yours.</em></h2>
        </div>
        <div className="steps">
          <article className="step-card">
            <span className="step-number">01</span><span className="step-icon">◉</span>
            <h3>Connect wallet</h3><p>Your wallet owns the card and confirms its one-time mint.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02</span><span className="step-icon">✳</span>
            <h3>Connect X + write</h3><p>Sign into your X account, then write what you’re grateful for.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03</span><span className="step-icon">↗</span>
            <h3>Mint your keepsake</h3><p>One payment, one NFT on Base. Download it or share it with someone.</p>
          </article>
        </div>
      </section>
      <div className="final-note"><span>✳</span><p>For the little things that turn out<br />to be the big things.</p><a href="#mint">Make a card <span aria-hidden="true">↗</span></a></div>
    </main>
  );
}
