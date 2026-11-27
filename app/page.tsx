import { MintForm } from "@/components/MintForm";
import { RecentCards } from "@/components/RecentCards";
import { CardArt } from "@/components/CardArt";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-note"><span className="status-dot" /> THANKSGIVING 2026 · BUILT ON BASE</div>
          <h1>Say thanks.<br /><em>Keep it.</em></h1>
          <p>Write what matters. Connect your real X account. Mint a one-of-one gratitude card to your wallet.</p>
          <a className="button button-primary hero-cta" href="#mint">Make your card <span aria-hidden="true">↓</span></a>
          <div className="hero-proof"><span>01</span><span>Your words, onchain</span><i>·</i><span>Your X photo, built in</span></div>
        </div>
        <div className="hero-visual" aria-label="Example gratitude card">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="hero-template-card">
            <CardArt text="the people who make this feel like home" tokenId="0000" preview />
          </div>
          <div className="hero-sticker">your words<br /><strong>your card</strong><span>✳</span></div>
          <div className="hero-caption">No photo upload. Your X profile appears automatically.</div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <span>YOUR WORDS, ONCHAIN</span><b>✳</b><span>ONE WALLET · ONE X ACCOUNT</span><b>✳</b><span>MADE TO BE KEPT</span><b>✳</b>
          <span>YOUR WORDS, ONCHAIN</span><b>✳</b><span>ONE WALLET · ONE X ACCOUNT</span><b>✳</b><span>MADE TO BE KEPT</span><b>✳</b>
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
          <p className="eyebrow">A little ritual, made simple</p>
          <h2>Make it real.<br /><em>Keep it close.</em></h2>
        </div>
        <div className="steps">
          <article className="step-card">
            <span className="step-number">01 / IDENTITY</span><span className="step-icon">◉</span>
            <h3>Sign in as you</h3><p>Connect your X account. We add your real profile photo to the card—no image upload needed.</p>
          </article>
          <article className="step-card">
            <span className="step-number">02 / MESSAGE</span><span className="step-icon">✳</span>
            <h3>Write what matters</h3><p>Up to 100 bytes of gratitude, fitted to the card. Your message is stored onchain.</p>
          </article>
          <article className="step-card">
            <span className="step-number">03 / KEEPSAKE</span><span className="step-icon">↗</span>
            <h3>Mint on Base</h3><p>One card per wallet and X account. Your wallet owns it; the public card is easy to share.</p>
          </article>
        </div>
      </section>
      <div className="final-note"><span>✳</span><p>For the little things that turn out<br />to be the big things.</p><a href="#mint">Make a card <span aria-hidden="true">↗</span></a></div>
    </main>
  );
}
