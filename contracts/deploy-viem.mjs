// Deploy updated Thanksmaxxing contract (MAX_TEXT_BYTES=1000, mintPrice=0.0003 ETH)
// Uses solc-js for compilation + viem for deployment
import { readFileSync, writeFileSync } from 'fs';
import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── 1. Load env ────────────────────────────────────────────
const envText = readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const pk = env.DEPLOYER_PRIVATE_KEY.startsWith('0x')
  ? env.DEPLOYER_PRIVATE_KEY
  : '0x' + env.DEPLOYER_PRIVATE_KEY;
const attestor = env.X_ATTESTOR_ADDRESS;
const mintPriceWei = BigInt(env.MINT_PRICE_WEI); // 300000000000000
const baseUri = env.TOKEN_BASE_URI || '';

console.log('Mint price (wei):', mintPriceWei.toString());
console.log('Attestor:', attestor);
console.log('Base URI:', baseUri);

// ── 2. Compile with solc-js ────────────────────────────────
const solc = require('solc');
console.log('solc version:', solc.version());

// Read the standard-input JSON (has all OZ sources), replace Thanksmaxxing.sol content
const stdInput = JSON.parse(readFileSync('out/Thanksmaxxing.standard-input.json', 'utf8'));
// Update the source with MAX_TEXT_BYTES = 1000
stdInput.sources['src/Thanksmaxxing.sol'].content = readFileSync('src/Thanksmaxxing.sol', 'utf8');
// Ensure output selection includes abi + evm.bytecode
stdInput.settings.outputSelection = {
  'src/Thanksmaxxing.sol': {
    'Thanksmaxxing': ['abi', 'evm.bytecode']
  }
};

console.log('Compiling...');
const output = JSON.parse(solc.compile(JSON.stringify(stdInput)));

if (output.errors) {
  const fatals = output.errors.filter(e => e.severity === 'error');
  if (fatals.length) {
    console.error('Compilation errors:');
    fatals.forEach(e => console.error(e.formattedMessage));
    process.exit(1);
  }
}

const compiled = output.contracts['src/Thanksmaxxing.sol']['Thanksmaxxing'];
const abi = compiled.abi;
const bytecode = '0x' + compiled.evm.bytecode.object;
console.log('Compiled. Bytecode length:', bytecode.length);

// Save artifact for verification later
writeFileSync('out/Thanksmaxxing-v2-artifact.json', JSON.stringify({ abi, bytecode }, null, 2));

// ── 3. Deploy with viem ────────────────────────────────────
const account = privateKeyToAccount(pk);
console.log('Deployer:', account.address);

const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });

// Check balance
const balance = await publicClient.getBalance({ address: account.address });
console.log('Deployer balance:', balance.toString(), 'wei', '(' + (Number(balance) / 1e18).toFixed(6) + ' ETH)');

if (balance < 100000000000000n) { // 0.0001 ETH min
  console.error('Balance too low for deployment');
  process.exit(1);
}

// Encode constructor args: (uint256 initialMintPrice, address initialOwner, address initialXAttestor)
const { encodeAbiParameters, parseAbiParameters } = await import('viem');

console.log('Deploying...');
const hash = await walletClient.deployContract({
  abi,
  bytecode,
  args: [mintPriceWei, account.address, attestor],
});
console.log('Deploy tx:', hash);

console.log('Waiting for confirmation...');
const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
console.log('Contract deployed at:', receipt.contractAddress);
console.log('Block:', receipt.blockNumber.toString());
console.log('Gas used:', receipt.gasUsed.toString());

// Set base URI if provided
if (baseUri) {
  console.log('Setting base URI...');
  const setUriHash = await walletClient.writeContract({
    address: receipt.contractAddress,
    abi,
    functionName: 'setBaseURI',
    args: [baseUri],
  });
  console.log('setBaseURI tx:', setUriHash);
  await publicClient.waitForTransactionReceipt({ hash: setUriHash });
  console.log('Base URI set.');
}

// Output for updating configs
console.log('\n=== UPDATE THESE ===');
console.log('CONTRACT_ADDRESS=' + receipt.contractAddress);
console.log('DEPLOYMENT_BLOCK=' + receipt.blockNumber.toString());
