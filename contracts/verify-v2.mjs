import { readFileSync, writeFileSync } from 'fs';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

const CONTRACT = '0xc78cd4be3d3ce7fe1f9146bc8f2671df2974d557';
const OWNER = '0x822A419ED4E88C28D32092C6077E95e5aA539d84';
const ATTESTOR = '0x04DD77FdCDa904F4164d4F50e3661F71e0AaD110';
const MINT_PRICE = 300000000000000n;

// 1. Build v2 standard-input JSON
const stdInput = JSON.parse(readFileSync('out/Thanksmaxxing.standard-input.json', 'utf8'));
stdInput.sources['src/Thanksmaxxing.sol'].content = readFileSync('src/Thanksmaxxing.sol', 'utf8');
const stdInputStr = JSON.stringify(stdInput);
writeFileSync('out/Thanksmaxxing-v2.standard-input.json', stdInputStr);

// 2. Encode constructor args
const ctorArgsHex = encodeAbiParameters(
  parseAbiParameters('uint256, address, address'),
  [MINT_PRICE, OWNER, ATTESTOR]
).slice(2); // strip 0x

console.log('Saved out/Thanksmaxxing-v2.standard-input.json');
console.log('Compiler: v0.8.28+commit.7893614a');
console.log('Optimization: Yes, 200 runs, viaIR: true');
console.log('Constructor args (ABI-encoded):', ctorArgsHex);

// 3. Submit to Sourcify v2 API / legacy verify
try {
  const res = await fetch('https://sourcify.dev/server/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: CONTRACT,
      chain: '8453',
      files: {
        'Thanksmaxxing.standard-input.json': stdInputStr,
      },
      compilerVersion: '0.8.28+commit.7893614a',
      contractName: 'src/Thanksmaxxing.sol:Thanksmaxxing',
    }),
  });
  const data = await res.json();
  console.log('Sourcify response:', res.status, JSON.stringify(data));
} catch (err) {
  console.log('Sourcify error:', err.message);
}

// 4. Check if BASESCAN_API_KEY is set in .env
const envText = readFileSync('.env', 'utf8');
const apiKeyLine = envText.split('\n').find(l => l.trim().startsWith('BASESCAN_API_KEY='));
const apiKey = apiKeyLine ? apiKeyLine.split('=')[1].trim() : '';

if (apiKey) {
  console.log('Submitting to Etherscan v2 / Basescan...');
  const form = new URLSearchParams({
    chainid: '8453',
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: CONTRACT,
    sourceCode: stdInputStr,
    codeformat: 'solidity-standard-json-input',
    contractname: 'src/Thanksmaxxing.sol:Thanksmaxxing',
    compilerversion: 'v0.8.28+commit.7893614a',
    constructorArguements: ctorArgsHex,
  });
  const res = await fetch(`https://api.etherscan.io/v2/api?apikey=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  console.log('Basescan submit:', JSON.stringify(data));
} else {
  console.log('No BASESCAN_API_KEY in contracts/.env — ready for manual upload on basescan.org/verifyContract');
}
