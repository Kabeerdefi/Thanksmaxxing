# Thanksmaxxing — Build Master Handoff

Updated: 2026-11-27

## Product

Thanksmaxxing is a Base mainnet gratitude-card collectible. A person signs into their own X account, writes a short gratitude message, connects a wallet, and mints one card. Their X profile image is fetched automatically; there is no user image upload. The contract enforces one mint per wallet and one per X account.

## Product facts to preserve

- The deployed contract is live on Base mainnet. Do not redeploy or replace it as part of a visual refresh.
- The contract limit is **100 UTF-8 bytes** per gratitude message. Fit all valid messages in the card preview and generated share image by scaling the type down as the byte count grows. Do not suggest unlimited text.
- The card image and message are public and onchain. X sign-in proves control of the account and supplies its profile photo.
- Keep wallet and X checks visible before the mint action; keep the price, Base network, one-per-wallet/X rule, and onchain storage clear.
- Never copy credentials from `.dev.vars`, `.env.production.local`, or `contracts/.env` into this file, chat, logs, or Git.

## Current design direction

- Use the new Thanksgiving card as the visual anchor: warm parchment, royal/cobalt blue, and the card's pink accent.
- Keep the surrounding interface readable and mostly neutral, with Base blue reserved for main actions and key state. Use short, purposeful motion and respect `prefers-reduced-motion`.
- The new SVG supplied by the owner was converted into an optimized WebP and cleaned in the message area for dynamic text. The original remains in Downloads. Production asset: `public/thanksmaxxing-card-template.webp`.
- Supplied soundtrack is at `public/thanksmaxxing-theme.mp3`. The persistent music control attempts autoplay, falls back to a user click when the browser blocks it, and stores the mute preference locally.
- Card composition must stay consistent between `components/CardArt.tsx` and `app/api/card/[id]/route.ts` (social/marketplace image).

## Design research reviewed

- Base brand guidelines: core grayscale + Base blue, secondary pink used sparingly; motion should be quick and functional. Source: https://brand.base.org/.
- Layout and interaction references reviewed: Framer Marketplace, Refero Styles, Mobbin, Appllama, ScreensDesign, 60fps, 21st.dev, Bencho, React Bits, Magic UI, and Uiverse.
- Several supplied links could not be read by the research browser: the X post, Designeer, Inspora, AppShots, and AppKittie. Their URLs were still checked. Do not block the build on them.

## Work in progress

- Home-page hierarchy and copy are being refreshed in `app/page.tsx` and `app/globals.css`.
- Mint instructions and card preview are being updated in `components/MintForm.tsx` and `components/CardArt.tsx`.
- A site-wide soundtrack control is in `components/MusicToggle.tsx`, mounted in `app/layout.tsx`.
- The Open Graph/card renderer uses the new template and matching long-text sizing in `app/api/card/[id]/route.ts`.
- README was updated for the new assets. All current edits are local until the production build completes.

## Ship sequence

1. Let the current `npm run build:vinext` process finish. If it succeeds, review `git status` and `git diff --check`; do not print `.dev.vars` values.
2. Commit the UI, template, soundtrack, and this handoff on `main`, then push `origin main`.
3. Deploy the freshly built Worker with `cf deploy --prebuilt --mode production --secrets-file .dev.vars`. Do not use `--prebuilt` before a fresh successful build.
4. Check the live home page, X sign-in state, music control, and one long message near the 100-byte limit. Keep the deployed contract untouched.

## Local setup

- Repo: `C:\Users\HP\Documents\experiments\thanksmaxxing`
- Production URL: https://thanksmaxxing.xyz
- Build command: `npm run build:vinext`
- Deploy command: `.\node_modules\.bin\cf.cmd deploy --prebuilt --mode production --secrets-file .dev.vars`
- `.dev.vars` is ignored by Git. Use it only as the local Cloudflare secrets source.
