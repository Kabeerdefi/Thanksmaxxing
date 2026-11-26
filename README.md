<<<<<<< HEAD
# Thanksmaxxing

A small Base NFT mint for one line of gratitude. Each token stores the text, the authenticated X account's stable numeric ID and username, and its profile image URL onchain. The fixed Thanksgiving 2026 card template is shared by everyone; there is no user image upload.

## Local setup

1. Copy .env.example to .env.local for the web app and to contracts/.env for Foundry. Fill the relevant settings in each file; never copy secrets into chat.
2. Install dependencies with npm install.
3. Run npm run dev.
4. Deploy and verify the contract on Base Sepolia before setting NEXT_PUBLIC_CONTRACT_ADDRESS.
5. Use `npm run build:vinext` and `npm run start:vinext` to build and preview the Cloudflare Worker locally. Authenticate with `npx cf auth login`. For the first deployment, build and then run `npx cf deploy --prebuilt --mode production --secrets-file .dev.vars`; after the Worker exists, secrets can also be updated from the Cloudflare dashboard.

The app defaults to Base Sepolia. Change NEXT_PUBLIC_CHAIN_ID to 8453 only for a reviewed production launch. The app shows a live card preview and checks the UTF-8 byte limit. A mint needs X OAuth sign-in, a wallet signature, a server EIP-712 attestation, and one payable mint transaction. The contract allows one mint ever per wallet and per stable X account ID.

The approved card template lives in public/thanksmaxxing-card-template.png. The X account owner signs in through OAuth; the app gets that account's own profile image and overlays it with their gratitude text and minted token details. Typing another person's handle cannot claim their identity. The mint records the authenticated account ID so a handle change does not create a second allowance.

## Environment

See .env.example for settings. Never commit .env, .env.local, `.dev.vars`, contracts/.env, or a private key. NEXT_PUBLIC_CONTRACT_ADDRESS stays blank until the contract has actually been deployed.

For X login, create an X OAuth 2.0 Web App with the `users.read` scope and register the exact callback URL `/api/auth/x/callback` for each host (local Cloudflare dev defaults to `http://localhost:3001/api/auth/x/callback`; after deployment, register the Worker's HTTPS URL). Put `X_CLIENT_ID`, `X_CLIENT_SECRET`, and `AUTH_COOKIE_SECRET` in the ignored `.dev.vars` file for local Cloudflare development. The OAuth routes read those Worker secrets at runtime. Set the same client ID and client secret as Worker secrets in Cloudflare for deployment. The callback URL and site origin default to the incoming request's host; `X_CALLBACK_URL` and `NEXT_PUBLIC_SITE_URL` can override those values. The OAuth token is used once to fetch the authenticated user's profile and is then discarded; no X posting scope is requested.

Generate a dedicated EIP-712 attestor key with no funds. Put its private key in `X_ATTESTOR_PRIVATE_KEY` in the ignored local `.dev.vars` file and as a Cloudflare Worker secret. Put its matching public address in `X_ATTESTOR_ADDRESS` in `contracts/.env` before contract deployment. The contract owner can rotate the attestor later. Never prefix the private key with `NEXT_PUBLIC_` or commit it.

## Manual steps before mainnet

- Confirm the final mint fee.
- Run the Solidity test suite, inspect the generated PNG and metadata, and mint end to end on Base Sepolia.
- Run Slither or an equivalent static analyzer and review findings.
- Verify the Base Sepolia source on Basescan.
- Deploy production to Base only after the testnet review.
- Set the initial owner to a Safe or hardware wallet; finish the Ownable2Step transfer.
- Set the production metadata base URI, verify the contract, and perform one real mint from the production site.

## Owner-only functions

The contract owner can transfer or accept ownership, set the mint price, rotate the X attestor, change the metadata base URI, pause, unpause, and withdraw collected ETH. See contracts/README.md for the complete list.
=======
# Thanksmaxxing
>>>>>>> origin/main
