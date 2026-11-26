# Contract and Base deployment

Install Foundry and OpenZeppelin Contracts v5 before running these commands. Keep the deployment key in a local, ignored .env file; never paste it into chat or commit it.

The script reads DEPLOYER_PRIVATE_KEY, INITIAL_OWNER_ADDRESS, X_ATTESTOR_ADDRESS, MINT_PRICE_WEI, and TOKEN_BASE_URI. INITIAL_OWNER_ADDRESS defaults to the deployer address; for production, prefer a hardware wallet or Safe. X_ATTESTOR_ADDRESS is the address derived from the separate server-only `X_ATTESTOR_PRIVATE_KEY`; that private key belongs in the web host's server environment and must never be committed.

For Base Sepolia, set MINT_PRICE_WEI to the fee selected at launch and TOKEN_BASE_URI to the deployed site metadata route, including its trailing slash. Then run:

    forge install OpenZeppelin/openzeppelin-contracts@v5.4.0
    forge install foundry-rs/forge-std@v1.9.7
    forge test
    forge script script/Deploy.s.sol:DeployThanksmaxxing --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify --chain base-sepolia --etherscan-api-key $BASESCAN_API_KEY

For Base mainnet, use a funded Base mainnet deployer, confirm the mint price and owner, then deploy with:

    forge script script/Deploy.s.sol:DeployThanksmaxxing --rpc-url $BASE_MAINNET_RPC_URL --broadcast --verify --chain base --etherscan-api-key $BASESCAN_API_KEY

After deployment, set `NEXT_PUBLIC_CHAIN_ID=8453`, `NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org`, and the deployed contract address in the web build environment. Do not deploy the web app with an empty contract address.

For production, repeat only after the testnet mint, image, metadata, and source verification have been checked. Transfer ownership with the two-step flow and have the new owner call acceptOwnership.

## Owner-only functions

- transferOwnership(address): proposes the next owner; the recipient must call acceptOwnership().
- acceptOwnership(): completes the two-step owner transfer.
- setMintPrice(uint256): updates the exact ETH mint fee.
- setXAttestor(address): rotates the signer used for X account mint attestations.
- setBaseURI(string): changes the metadata URL prefix.
- pause(): stops new mints.
- unpause(): resumes new mints.
- withdraw(): sends all collected ETH to the current owner.
- renounceOwnership(): disabled so ownership and access to mint proceeds cannot be accidentally lost.

Minting requires a live server attestation bound to `msg.sender`, the stable numeric X user ID, username, profile image URL, one-time nonce, deadline, chain, and contract. There is no unauthenticated mint function. The contract permanently reserves the minting wallet and X account ID before the ERC-721 receiver callback; transferring the NFT does not restore either mint allowance.

The card template, gratitude text, X user ID, X username, and profile image URL cannot be changed after minting.
